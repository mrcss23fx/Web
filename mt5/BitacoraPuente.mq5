//+------------------------------------------------------------------+
//| BitacoraPuente.mq5                                               |
//| Envía tus operaciones de MetaTrader 5 a tu Bitácora:             |
//| se apuntan solas, con la captura del gráfico al entrar y salir.  |
//|                                                                  |
//| Cómo se usa (2 minutos):                                         |
//| 1. En la Bitácora: Mi plan → Conectar MT5 → copia tu clave.      |
//| 2. MT5: Herramientas → Opciones → Asesores expertos → marca       |
//|    «Permitir WebRequest para las URL de la lista» y añade:        |
//|    https://xsvezicjksfrklwjskfv.supabase.co                      |
//| 3. Arrastra este programa a cualquier gráfico, pega tu clave     |
//|    y activa «Trading algorítmico» (botón de arriba).             |
//| Mantén abierto un gráfico de cada mercado que operes: de ahí     |
//| sale la captura. El programa NO abre ni cierra operaciones.      |
//+------------------------------------------------------------------+
#property copyright   "Bitácora"
#property version     "1.10"
#property description "Apunta solas tus operaciones en tu Bitácora, con la captura del gráfico al entrar y al salir. No abre ni cierra operaciones."

input string ClaveBitacora   = "";    // Tu clave de conexión (Mi plan → Conectar MT5)
input bool   GuardarCapturas = true;  // Guardar la captura del gráfico
input int    AnchoCaptura    = 1000;  // Ancho de la captura (píxeles)
input int    AltoCaptura     = 560;   // Alto de la captura (píxeles)
input bool   RehacerFoto     = true;  // Si no hubo foto en el momento, rehacerla con el historial

#define BT_URL      "https://xsvezicjksfrklwjskfv.supabase.co"
#define BT_RPC      "/rest/v1/rpc/bridge_ingest"
#define BT_APIKEY   "sb_publishable_qLIhdI4CuQuisOstwl0fWg_dhW61xcm"
#define BT_VERSION  "1.1"
#define BT_STATE    "bitacora_estado.csv"
#define BT_CAPFILE  "bitacora_captura.png"

//--- lo que sabemos de cada posición
struct PosState
  {
   ulong             id;
   double            sl0;        // stop con el que entraste
   bool              slMoved;    // moviste el stop en contra
   bool              openSent;
   bool              closedSent;
  };
PosState g_pos[];

//--- envíos pendientes (se reintentan si falla la conexión)
struct Job
  {
   ulong             id;
   int               kind;       // 0 = entrada, 1 = salida
   datetime          due;        // hora local a la que enviarlo
   int               tries;
   string            capture;    // captura en base64
  };
Job g_jobs[];

datetime g_lastOk   = 0;
datetime g_lastPing = 0;
datetime g_lastScan = 0;
string   g_status   = "Conectando…";
bool     g_urlAlert = false;

//+------------------------------------------------------------------+
int OnInit()
  {
   if(StringLen(ClaveBitacora) < 10)
     {
      Alert("Bitácora: pega tu clave de conexión (Mi plan → Conectar MT5).");
      return(INIT_PARAMETERS_INCORRECT);
     }
   LoadState();
   EventSetTimer(5);
   CatchUp();
   SendPing();
   ShowStatus();
   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   EventKillTimer();
   SaveState();
   Comment("");
  }

//+------------------------------------------------------------------+
//| Cada operación que entra o sale                                  |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
  {
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
     {
      if(!HistoryDealSelect(trans.deal))
         return;
      long dtype = HistoryDealGetInteger(trans.deal, DEAL_TYPE);
      if(dtype != DEAL_TYPE_BUY && dtype != DEAL_TYPE_SELL)
         return;                                   // depósitos, comisiones sueltas…
      long  entry = HistoryDealGetInteger(trans.deal, DEAL_ENTRY);
      ulong pos   = (ulong)HistoryDealGetInteger(trans.deal, DEAL_POSITION_ID);
      string sym  = HistoryDealGetString(trans.deal, DEAL_SYMBOL);
      if(entry == DEAL_ENTRY_IN)
        {
         int k = FindOrAddPos(pos);
         if(g_pos[k].openSent)
            return;                                // aumento de una posición ya enviada
         // esperamos 20 s por si pones el stop justo después de entrar
         AddJob(pos, 0, TimeLocal() + 20, Capture(sym));
        }
      else
         if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_OUT_BY || entry == DEAL_ENTRY_INOUT)
           {
            if(!PositionSelectByTicket(pos))        // cerrada del todo
              {
               FindOrAddPos(pos);
               AddJob(pos, 1, TimeLocal() + 2, Capture(sym));
              }
           }
     }
   else
      if(trans.type == TRADE_TRANSACTION_POSITION)
         WatchStop(trans.position);
  }

//+------------------------------------------------------------------+
//| ¿Has movido el stop en contra?                                   |
//+------------------------------------------------------------------+
void WatchStop(const ulong pos)
  {
   if(!PositionSelectByTicket(pos))
      return;
   int k = FindOrAddPos(pos);
   double sl = PositionGetDouble(POSITION_SL);
   if(!g_pos[k].openSent)
     {
      g_pos[k].sl0 = sl;                           // aún dentro de los primeros 20 s
      return;
     }
   if(g_pos[k].sl0 <= 0)
     {
      if(sl > 0)
         g_pos[k].sl0 = sl;                        // entraste sin stop y lo pusiste después
      return;
     }
   string sym  = PositionGetString(POSITION_SYMBOL);
   double half = SymbolInfoDouble(sym, SYMBOL_POINT) / 2.0;
   long   type = PositionGetInteger(POSITION_TYPE);
   bool against = false;
   if(sl <= 0)
      against = true;                              // quitaste el stop
   else
      if(type == POSITION_TYPE_BUY)
         against = (sl < g_pos[k].sl0 - half);
      else
         against = (sl > g_pos[k].sl0 + half);
   if(against && !g_pos[k].slMoved)
     {
      g_pos[k].slMoved = true;
      SaveState();
     }
  }

//+------------------------------------------------------------------+
void OnTimer()
  {
   datetime now = TimeLocal();
   for(int i = 0; i < ArraySize(g_jobs); i++)
     {
      if(g_jobs[i].due > now)
         continue;
      string err = "";
      if(SendJob(g_jobs[i], err))
        {
         RemoveJob(i);
         i--;
        }
      else
        {
         g_jobs[i].tries++;
         g_jobs[i].due = now + 30 * g_jobs[i].tries;
         g_status = "Sin conexión, reintentando: " + err;
         if(g_jobs[i].tries > 20)
           {
            Print("Bitácora: no se pudo enviar la posición ", g_jobs[i].id, " (", err, ")");
            RemoveJob(i);
            i--;
           }
        }
     }
   if(now - g_lastPing > 300)
      SendPing();
   if(now - g_lastScan > 600)                     // cada 10 min: ¿algo hecho desde el móvil o con el Mac dormido?
      CatchUp();
   ShowStatus();
  }

//+------------------------------------------------------------------+
//| Al arrancar: lo que pasó mientras MT5 estaba cerrado (7 días)    |
//+------------------------------------------------------------------+
void CatchUp()
  {
   g_lastScan = TimeLocal();
   for(int i = 0; i < PositionsTotal(); i++)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0)
         continue;
      ulong pos = (ulong)PositionGetInteger(POSITION_IDENTIFIER);
      int k = FindOrAddPos(pos);
      if(g_pos[k].openSent)
         continue;
      datetime opened = (datetime)PositionGetInteger(POSITION_TIME);
      string cap = (TimeTradeServer() - opened < 300) ? Capture(PositionGetString(POSITION_SYMBOL)) : "";
      AddJob(pos, 0, TimeLocal() + 3, cap);
     }
   if(!HistorySelect(TimeCurrent() - 7 * 86400, TimeCurrent() + 86400))
      return;
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
     {
      ulong deal = HistoryDealGetTicket(i);
      if(deal == 0)
         continue;
      long entry = HistoryDealGetInteger(deal, DEAL_ENTRY);
      long dtype = HistoryDealGetInteger(deal, DEAL_TYPE);
      if(dtype != DEAL_TYPE_BUY && dtype != DEAL_TYPE_SELL)
         continue;
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY && entry != DEAL_ENTRY_INOUT)
         continue;
      ulong pos = (ulong)HistoryDealGetInteger(deal, DEAL_POSITION_ID);
      if(PositionSelectByTicket(pos))
         continue;                                 // sigue abierta
      int k = FindOrAddPos(pos);
      if(!g_pos[k].closedSent && !HasJob(pos, 1))
         AddJob(pos, 1, TimeLocal() + 5, "");
     }
  }

//+------------------------------------------------------------------+
//| Construye y envía una operación                                  |
//+------------------------------------------------------------------+
bool SendJob(Job &job, string &err)
  {
   int k = FindOrAddPos(job.id);
   bool isOpen = PositionSelectByTicket(job.id);
   if(isOpen && !g_pos[k].openSent)
      g_pos[k].sl0 = PositionGetDouble(POSITION_SL);   // el stop que tenías a los 20 s

   if(!HistorySelectByPosition(job.id))
     {
      err = "sin historial";
      return(false);
     }
   string   sym = "";
   long     side = -1;
   double   vol = 0, openPrice = 0, closePrice = 0, dealSL = 0, dealTP = 0;
   double   profit = 0, commission = 0, swap = 0;
   datetime openTime = 0, closeTime = 0;
   int n = HistoryDealsTotal();
   for(int i = 0; i < n; i++)
     {
      ulong d = HistoryDealGetTicket(i);
      if(d == 0)
         continue;
      long entry = HistoryDealGetInteger(d, DEAL_ENTRY);
      long dtype = HistoryDealGetInteger(d, DEAL_TYPE);
      profit     += HistoryDealGetDouble(d, DEAL_PROFIT);
      commission += HistoryDealGetDouble(d, DEAL_COMMISSION) + HistoryDealGetDouble(d, DEAL_FEE);
      swap       += HistoryDealGetDouble(d, DEAL_SWAP);
      if(entry == DEAL_ENTRY_IN)
        {
         if(openTime == 0)
           {
            openTime  = (datetime)HistoryDealGetInteger(d, DEAL_TIME);
            openPrice = HistoryDealGetDouble(d, DEAL_PRICE);
            sym       = HistoryDealGetString(d, DEAL_SYMBOL);
            side      = dtype;
            dealSL    = HistoryDealGetDouble(d, DEAL_SL);
            dealTP    = HistoryDealGetDouble(d, DEAL_TP);
           }
         vol += HistoryDealGetDouble(d, DEAL_VOLUME);
        }
      else
         if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_OUT_BY || entry == DEAL_ENTRY_INOUT)
           {
            closeTime  = (datetime)HistoryDealGetInteger(d, DEAL_TIME);
            closePrice = HistoryDealGetDouble(d, DEAL_PRICE);
           }
     }
   if(openTime == 0 || sym == "")
     {
      err = "operación incompleta";
      return(false);
     }
   double sl0 = g_pos[k].sl0 > 0 ? g_pos[k].sl0 : dealSL;
   double tp  = dealTP;
   if(isOpen)
     {
      if(sl0 <= 0)
         sl0 = PositionGetDouble(POSITION_SL);
      if(tp <= 0)
         tp = PositionGetDouble(POSITION_TP);
     }

   // Riesgo: lo que perdías si el precio tocaba tu stop
   double riskMoney = 0;
   if(sl0 > 0)
     {
      double loss = 0;
      ENUM_ORDER_TYPE ot = (side == DEAL_TYPE_BUY) ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
      if(OrderCalcProfit(ot, sym, vol, openPrice, sl0, loss))
         riskMoney = MathAbs(loss);
     }
   double net = profit + commission + swap;
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   if(!isOpen)
      balance -= net;                              // saldo aproximado al entrar
   double riskPct = (riskMoney > 0 && balance > 0) ? riskMoney / balance * 100.0 : 0;

   int    dg  = (int)SymbolInfoInteger(sym, SYMBOL_DIGITS);
   long   off = ServerOffset();
   string js  = "{";
   js += "\"version\":\"" + BT_VERSION + "\"";
   js += ",\"account\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\"";
   js += ",\"broker\":\"" + JsonEsc(AccountInfoString(ACCOUNT_COMPANY)) + "\"";
   js += ",\"currency\":\"" + JsonEsc(AccountInfoString(ACCOUNT_CURRENCY)) + "\"";
   js += ",\"position\":\"" + IntegerToString((long)job.id) + "\"";
   js += ",\"symbol\":\"" + JsonEsc(sym) + "\"";
   js += ",\"side\":\"" + (side == DEAL_TYPE_BUY ? "buy" : "sell") + "\"";
   js += ",\"volume\":" + DoubleToString(vol, 2);
   js += ",\"open_time\":" + IntegerToString((long)openTime - off);
   js += ",\"open_price\":" + DoubleToString(openPrice, dg);
   js += ",\"sl\":" + DoubleToString(sl0, dg);
   js += ",\"tp\":" + DoubleToString(tp, dg);
   js += ",\"sl_moved\":" + (g_pos[k].slMoved ? "true" : "false");
   js += ",\"balance\":" + DoubleToString(balance, 2);
   js += ",\"risk_money\":" + DoubleToString(riskMoney, 2);
   js += ",\"risk_pct\":" + DoubleToString(riskPct, 3);
   if(isOpen)
      js += ",\"status\":\"open\"";
   else
     {
      js += ",\"status\":\"closed\"";
      js += ",\"close_time\":" + IntegerToString((long)closeTime - off);
      js += ",\"close_price\":" + DoubleToString(closePrice, dg);
      js += ",\"profit\":" + DoubleToString(profit, 2);
      js += ",\"commission\":" + DoubleToString(commission, 2);
      js += ",\"swap\":" + DoubleToString(swap, 2);
      if(riskMoney > 0)
         js += ",\"r\":" + DoubleToString(net / riskMoney, 2);
     }
   // Sin foto del momento (operación desde el móvil, Mac dormido o sin gráfico abierto):
   // la rehacemos con el historial de precios, con la entrada, la salida, el stop y el objetivo marcados.
   if(job.capture == "" && RehacerFoto && job.tries == 0)
     {
      bool wantIt = (job.kind == 1 && !isOpen) || (job.kind == 0 && !g_pos[k].openSent);
      if(wantIt)
        {
         job.capture = CaptureHistory(sym, side, openTime, isOpen ? 0 : closeTime, openPrice, closePrice, sl0, tp, !isOpen);
         if(job.capture != "" && !isOpen)
            job.kind = 1;                          // una operación ya cerrada: la foto enseña la operación entera
        }
     }
   if(job.capture != "")
      js += (job.kind == 0 ? ",\"capture_entry\":\"" : ",\"capture_exit\":\"") + job.capture + "\"";
   js += "}";

   if(!Post("{\"p_key\":\"" + JsonEsc(ClaveBitacora) + "\",\"p_trade\":" + js + "}", err))
      return(false);

   if(job.kind == 0 || isOpen)
      g_pos[k].openSent = true;
   if(!isOpen)
     {
      g_pos[k].openSent   = true;
      g_pos[k].closedSent = true;
     }
   SaveState();
   g_lastOk = TimeLocal();
   g_status = sym + (isOpen ? " · entrada apuntada" : " · operación cerrada y apuntada");
   return(true);
  }

void SendPing()
  {
   g_lastPing = TimeLocal();
   string err = "";
   // datos de los mercados de tu Observación de mercado: la calculadora de la app los usa para el tamaño exacto
   string syms = "";
   int total = SymbolsTotal(true);
   if(total > 40)
      total = 40;
   for(int i = 0; i < total; i++)
     {
      string s = SymbolName(i, true);
      double tv = SymbolInfoDouble(s, SYMBOL_TRADE_TICK_VALUE_LOSS);
      if(tv <= 0)
         tv = SymbolInfoDouble(s, SYMBOL_TRADE_TICK_VALUE);
      double ts = SymbolInfoDouble(s, SYMBOL_TRADE_TICK_SIZE);
      if(tv <= 0 || ts <= 0)
         continue;
      if(syms != "")
         syms += ",";
      syms += "{\"s\":\"" + JsonEsc(s) + "\",\"tv\":" + DoubleToString(tv, 8) + ",\"ts\":" + DoubleToString(ts, 10) +
              ",\"vmin\":" + DoubleToString(SymbolInfoDouble(s, SYMBOL_VOLUME_MIN), 2) +
              ",\"vstep\":" + DoubleToString(SymbolInfoDouble(s, SYMBOL_VOLUME_STEP), 2) +
              ",\"vmax\":" + DoubleToString(SymbolInfoDouble(s, SYMBOL_VOLUME_MAX), 2) +
              ",\"d\":" + IntegerToString(SymbolInfoInteger(s, SYMBOL_DIGITS)) +
              ",\"p\":" + DoubleToString(SymbolInfoDouble(s, SYMBOL_BID), (int)SymbolInfoInteger(s, SYMBOL_DIGITS)) + "}";
     }
   string js = "{\"p_key\":\"" + JsonEsc(ClaveBitacora) + "\",\"p_trade\":{\"ping\":\"1\",\"version\":\"" + BT_VERSION +
               "\",\"account\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) +
               "\",\"broker\":\"" + JsonEsc(AccountInfoString(ACCOUNT_COMPANY)) +
               "\",\"balance_now\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) +
               ",\"currency_now\":\"" + JsonEsc(AccountInfoString(ACCOUNT_CURRENCY)) +
               "\",\"symbols\":[" + syms + "]}}";
   if(Post(js, err))
     {
      g_lastOk = TimeLocal();
      if(StringFind(g_status, "Conectando") == 0 || StringFind(g_status, "Sin conexión") == 0)
         g_status = "Conectado";
     }
   else
      g_status = "Sin conexión: " + err;
  }

//+------------------------------------------------------------------+
//| Envío a la Bitácora                                              |
//+------------------------------------------------------------------+
bool Post(const string body, string &err)
  {
   char data[], res[];
   string resHeaders;
   int len = StringToCharArray(body, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(len > 0)
      ArrayResize(data, len - 1);                  // sin el 0 final
   string headers = "Content-Type: application/json\r\napikey: " + BT_APIKEY + "\r\n";
   ResetLastError();
   int code = WebRequest("POST", BT_URL + BT_RPC, headers, 15000, data, res, resHeaders);
   if(code == -1)
     {
      int e = GetLastError();
      if(e == 4014)
        {
         err = "falta permitir la dirección en Opciones";
         if(!g_urlAlert)
           {
            g_urlAlert = true;
            Alert("Bitácora: en Herramientas → Opciones → Asesores expertos, marca «Permitir WebRequest» y añade ", BT_URL);
           }
        }
      else
         err = "sin internet (" + IntegerToString(e) + ")";
      return(false);
     }
   if(code < 200 || code >= 300)
     {
      string txt = CharArrayToString(res, 0, WHOLE_ARRAY, CP_UTF8);
      if(StringFind(txt, "Clave no v") >= 0)
         err = "clave no válida: cópiala otra vez desde Mi plan";
      else
         err = "error " + IntegerToString(code);
      Print("Bitácora: respuesta ", code, " ", StringSubstr(txt, 0, 300));
      return(false);
     }
   return(true);
  }

//+------------------------------------------------------------------+
//| Captura del gráfico del mercado (si lo tienes abierto)           |
//+------------------------------------------------------------------+
string Capture(const string sym)
  {
   if(!GuardarCapturas || sym == "")
      return("");
   long cid = 0;
   if(_Symbol == sym)
      cid = ChartID();
   else
     {
      long c = ChartFirst();
      while(c >= 0)
        {
         if(ChartSymbol(c) == sym)
           {
            cid = c;
            break;
           }
         c = ChartNext(c);
        }
     }
   if(cid == 0 && _Symbol != sym)
     {
      Print("Bitácora: abre un gráfico de ", sym, " para que se guarde la captura.");
      return("");
     }
   ChartRedraw(cid);
   if(!ChartScreenShot(cid, BT_CAPFILE, AnchoCaptura, AltoCaptura, ALIGN_RIGHT))
      return("");
   return(ReadCapture());
  }

//+------------------------------------------------------------------+
//| Foto rehecha con el historial: abre un gráfico, se coloca en la   |
//| hora de la operación, la marca, hace la foto y lo cierra          |
//+------------------------------------------------------------------+
ENUM_TIMEFRAMES TfFor(const long secs)
  {
   if(secs <= 2 * 3600)
      return(PERIOD_M5);
   if(secs <= 8 * 3600)
      return(PERIOD_M15);
   if(secs <= 3 * 86400)
      return(PERIOD_H1);
   return(PERIOD_H4);
  }

string CaptureHistory(const string sym, const long side, const datetime tOpen, const datetime tClose,
                      const double pOpen, const double pClose, const double sl, const double tp, const bool closed)
  {
   if(!GuardarCapturas || sym == "" || tOpen == 0)
      return("");
   SymbolSelect(sym, true);
   datetime tEnd = closed ? tClose : TimeCurrent();
   if(tEnd < tOpen)
      tEnd = tOpen;
   ENUM_TIMEFRAMES tf = TfFor((long)(tEnd - tOpen));
   int ps = PeriodSeconds(tf);
   MqlRates rates[];
   if(CopyRates(sym, tf, tOpen - ps * 80, tEnd + ps * 20, rates) <= 0)
      return("");                                  // aún no hay historial descargado: se intentará en la próxima vuelta
   long cid = ChartOpen(sym, tf);
   if(cid <= 0)
      return("");
   ChartSetInteger(cid, CHART_AUTOSCROLL, false);
   ChartSetInteger(cid, CHART_SHIFT, false);
   ChartSetInteger(cid, CHART_SCALE, 3);

   string pre = "bt_";
   ObjectCreate(cid, pre + "in", (side == DEAL_TYPE_BUY ? OBJ_ARROW_BUY : OBJ_ARROW_SELL), 0, tOpen, pOpen);
   ObjectSetInteger(cid, pre + "in", OBJPROP_COLOR, clrRoyalBlue);
   ObjectSetInteger(cid, pre + "in", OBJPROP_WIDTH, 3);
   if(sl > 0)
     {
      ObjectCreate(cid, pre + "sl", OBJ_TREND, 0, tOpen, sl, tEnd, sl);
      ObjectSetInteger(cid, pre + "sl", OBJPROP_COLOR, clrDimGray);
      ObjectSetInteger(cid, pre + "sl", OBJPROP_STYLE, STYLE_DOT);
      ObjectSetInteger(cid, pre + "sl", OBJPROP_RAY_RIGHT, false);
     }
   if(tp > 0)
     {
      ObjectCreate(cid, pre + "tp", OBJ_TREND, 0, tOpen, tp, tEnd, tp);
      ObjectSetInteger(cid, pre + "tp", OBJPROP_COLOR, clrRoyalBlue);
      ObjectSetInteger(cid, pre + "tp", OBJPROP_STYLE, STYLE_DASH);
      ObjectSetInteger(cid, pre + "tp", OBJPROP_RAY_RIGHT, false);
     }
   ObjectCreate(cid, pre + "en", OBJ_TREND, 0, tOpen, pOpen, tEnd, pOpen);
   ObjectSetInteger(cid, pre + "en", OBJPROP_COLOR, clrRoyalBlue);
   ObjectSetInteger(cid, pre + "en", OBJPROP_RAY_RIGHT, false);
   if(closed)
     {
      ObjectCreate(cid, pre + "out", OBJ_ARROW_STOP, 0, tClose, pClose);
      ObjectSetInteger(cid, pre + "out", OBJPROP_COLOR, clrBlack);
      ObjectSetInteger(cid, pre + "out", OBJPROP_WIDTH, 2);
      ObjectCreate(cid, pre + "path", OBJ_TREND, 0, tOpen, pOpen, tClose, pClose);
      ObjectSetInteger(cid, pre + "path", OBJPROP_COLOR, clrBlack);
      ObjectSetInteger(cid, pre + "path", OBJPROP_STYLE, STYLE_DOT);
      ObjectSetInteger(cid, pre + "path", OBJPROP_RAY_RIGHT, false);
     }
   ChartRedraw(cid);
   // que la salida quede cerca del borde derecho, con 15 velas de margen
   int shiftEnd = iBarShift(sym, tf, tEnd, false);
   if(shiftEnd < 0)
      shiftEnd = 0;
   int back = shiftEnd - 15;
   if(back < 0)
      back = 0;
   ChartNavigate(cid, CHART_END, -back);
   ChartRedraw(cid);
   Sleep(400);
   bool ok = ChartScreenShot(cid, BT_CAPFILE, AnchoCaptura, AltoCaptura, ALIGN_RIGHT);
   ChartClose(cid);
   if(!ok)
      return("");
   return(ReadCapture());
  }

string ReadCapture()
  {
   int h = FileOpen(BT_CAPFILE, FILE_READ | FILE_BIN);
   if(h == INVALID_HANDLE)
      return("");
   uchar src[], key[], dst[];
   ulong size = FileSize(h);
   if(size == 0 || size > 1000000)
     {
      FileClose(h);
      FileDelete(BT_CAPFILE);
      return("");
     }
   FileReadArray(h, src, 0, (int)size);
   FileClose(h);
   FileDelete(BT_CAPFILE);
   if(CryptEncode(CRYPT_BASE64, src, key, dst) <= 0)
      return("");
   return(CharArrayToString(dst, 0, WHOLE_ARRAY, CP_ACP));
  }

//+------------------------------------------------------------------+
//| Utilidades                                                       |
//+------------------------------------------------------------------+
long ServerOffset()
  {
   long off = (long)(TimeTradeServer() - TimeGMT());
   return((long)MathRound(off / 1800.0) * 1800);   // hora del bróker → hora universal
  }

string JsonEsc(string s)
  {
   StringReplace(s, "\\", "\\\\");
   StringReplace(s, "\"", "\\\"");
   StringReplace(s, "\n", " ");
   StringReplace(s, "\r", " ");
   StringReplace(s, "\t", " ");
   return(s);
  }

int FindPos(const ulong id)
  {
   for(int i = 0; i < ArraySize(g_pos); i++)
      if(g_pos[i].id == id)
         return(i);
   return(-1);
  }

int FindOrAddPos(const ulong id)
  {
   int k = FindPos(id);
   if(k >= 0)
      return(k);
   k = ArraySize(g_pos);
   ArrayResize(g_pos, k + 1);
   g_pos[k].id = id;
   g_pos[k].sl0 = 0;
   g_pos[k].slMoved = false;
   g_pos[k].openSent = false;
   g_pos[k].closedSent = false;
   return(k);
  }

bool HasJob(const ulong id, const int kind)
  {
   for(int i = 0; i < ArraySize(g_jobs); i++)
      if(g_jobs[i].id == id && g_jobs[i].kind == kind)
         return(true);
   return(false);
  }

void AddJob(const ulong id, const int kind, const datetime due, const string capture)
  {
   if(HasJob(id, kind))
      return;
   int n = ArraySize(g_jobs);
   ArrayResize(g_jobs, n + 1);
   g_jobs[n].id = id;
   g_jobs[n].kind = kind;
   g_jobs[n].due = due;
   g_jobs[n].tries = 0;
   g_jobs[n].capture = capture;
  }

void RemoveJob(const int i)
  {
   int n = ArraySize(g_jobs);
   for(int j = i; j < n - 1; j++)
      g_jobs[j] = g_jobs[j + 1];
   ArrayResize(g_jobs, n - 1);
  }

void SaveState()
  {
   // guardamos solo las últimas 300 posiciones
   int start = MathMax(0, ArraySize(g_pos) - 300);
   int h = FileOpen(BT_STATE, FILE_WRITE | FILE_CSV | FILE_ANSI, ';');
   if(h == INVALID_HANDLE)
      return;
   for(int i = start; i < ArraySize(g_pos); i++)
      FileWrite(h, IntegerToString((long)g_pos[i].id), DoubleToString(g_pos[i].sl0, 8),
                (int)g_pos[i].slMoved, (int)g_pos[i].openSent, (int)g_pos[i].closedSent);
   FileClose(h);
  }

void LoadState()
  {
   ArrayResize(g_pos, 0);
   if(!FileIsExist(BT_STATE))
      return;
   int h = FileOpen(BT_STATE, FILE_READ | FILE_CSV | FILE_ANSI, ';');
   if(h == INVALID_HANDLE)
      return;
   while(!FileIsEnding(h))
     {
      string sid = FileReadString(h);
      if(sid == "")
         break;
      int k = FindOrAddPos((ulong)StringToInteger(sid));
      g_pos[k].sl0        = StringToDouble(FileReadString(h));
      g_pos[k].slMoved    = (StringToInteger(FileReadString(h)) == 1);
      g_pos[k].openSent   = (StringToInteger(FileReadString(h)) == 1);
      g_pos[k].closedSent = (StringToInteger(FileReadString(h)) == 1);
     }
   FileClose(h);
  }

void ShowStatus()
  {
   string last = g_lastOk > 0 ? TimeToString(g_lastOk, TIME_MINUTES) : "—";
   int pend = ArraySize(g_jobs);
   Comment("Bitácora · ", g_status, "\nÚltimo envío correcto: ", last,
           (pend > 0 ? "\nPendientes de enviar: " + IntegerToString(pend) : ""));
  }
//+------------------------------------------------------------------+
