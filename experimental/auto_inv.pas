uses SysUtils;

const GUID = '0123456789ABCDEF0123456789ABCDEF';

// Объявляем функции из системной библиотеки Windows
function WinHttpOpen(pwszUserAgent: PWideChar; dwAccessType: Cardinal; pwszProxyName: PWideChar; pwszProxyBypass: PWideChar; dwFlags: Cardinal): Pointer; stdcall; external 'winhttp.dll';
function WinHttpConnect(hSession: Pointer; pswzServerName: PWideChar; nServerPort: Integer; dwReserved: Cardinal): Pointer; stdcall; external 'winhttp.dll';
function WinHttpOpenRequest(hConnect: Pointer; pwszVerb: PWideChar; pwszObjectName: PWideChar; pwszVersion: PWideChar; pwszReferrer: PWideChar; rplpwszAcceptTypes: Pointer; dwFlags: Cardinal): Pointer; stdcall; external 'winhttp.dll';
function WinHttpSendRequest(hRequest: Pointer; pwszHeaders: PWideChar; dwHeadersLength: Cardinal; lpOptional: Pointer; dwOptionalLength: Cardinal; dwTotalLength: Cardinal; dwContext: Pointer): Boolean; stdcall; external 'winhttp.dll';
function WinHttpReceiveResponse(hRequest: Pointer; lpReserved: Pointer): Boolean; stdcall; external 'winhttp.dll';
function WinHttpCloseHandle(hInternet: Pointer): Boolean; stdcall; external 'winhttp.dll';


type
    TItemRec =packed record
        id: cardinal;
        count: cardinal;
    end;

    TInvList = class
    private
        FTotalCount, FSize : integer;
        FItems: array of TItemRec;
        FCheckSum:cardinal;
        function FFindID(const id: cardinal): integer;
        function FGetCount(const id: cardinal): cardinal;
        procedure FSetCount(const id: cardinal; const count: cardinal);
    public
      property  CheckSum:cardinal read FCheckSum;
        property TotalCount: integer read FTotalCount;
        property Values[id: cardinal]: cardinal read FGetCount write FSetCount; default;
        constructor Create();
        destructor Destroy; override;
        procedure Clear;
      function GetBuffer: Pointer;
    end;
function TInvList.GetBuffer: Pointer; 
begin
    if FTotalCount > 0 then
        Result := @FItems[0]
    else
        Result := nil;
end;
procedure TInvList.Clear;
begin
  FTotalCount := 0;
    FCheckSum := 0;
end;
constructor TInvList.Create;
begin
    inherited Create;
    FSize := 100;
     SetLength(FItems, FSize);
 Clear();
end;

destructor TInvList.Destroy;
begin
    SetLength(FItems, 0);
    inherited;
end;

function TInvList.FFindID(const id: cardinal): integer;
var
    j: Integer;
begin
    result := -1;
    for j := 0 to FTotalCount - 1 do
        if FItems[j].id = id then
        begin
            result := j;
            exit;
        end;

end;

function TInvList.FGetCount(const id: cardinal): cardinal;
var
    id_index: integer;
begin
    id_index := FFindID(id);
    if id_index = -1 then
        result := 0 else
    result := FItems[id_index].count;
end;

procedure TInvList.FSetCount(const id: cardinal; const count: cardinal);
var
    id_index: integer;
    old_count:cardinal;
begin
    id_index := FFindID(id);
    if id_index = -1 then
    begin         // key not found, add a new one
        if FTotalCount = FSize then
        begin
            FSize := FSize * 2;
            SetLength(FItems, FSize);
        end;
        id_index := FTotalCount;
        FItems[id_index].id := id;
        inc(FTotalCount);
        old_count := 0;
    end else
        old_count := FItems[id_index].count;



    FCheckSum := FCheckSum xor (id shl 7 xor id shr 25 xor old_count);
    FItems[id_index].count := count;
    FCheckSum := FCheckSum xor (id shl 7 xor id shr 25 xor count);

end;

procedure SendInventory(AList: TInvList; const AGUID: string);
var
  hSession, hConnect, hRequest: Pointer;
  ServerName, Path, Headers: widestring;
  DataPtr: Pointer;
  DataLen: Cardinal;
begin
  // Получаем доступ к сырым данным
  DataPtr := AList.GetBuffer;
  DataLen := AList.TotalCount * 8; // Каждая запись TItemRec = 8 байт

  // Если инвентарь пуст — ничего не шлем
  if (DataPtr = nil) or (DataLen = 0) then Exit;

  // Настройки как в вашем тесте [cite: 7]
  ServerName := 'localhost';
  Path := '/update?guid=' + AGUID;
  Headers := 'Content-Type: application/octet-stream' + #13#10;

  // Открываем сессию [cite: 8, 9]
  hSession := WinHttpOpen('mariko.dev.inventory', 1, nil, nil, 0);
  if hSession <> nil then begin
    // Подключаемся к Node.js (порт 5678) 
    hConnect := WinHttpConnect(hSession, PWideChar(ServerName), 49999, 0);
    if hConnect <> nil then begin
      // Создаем запрос [cite: 3, 11]
      hRequest := WinHttpOpenRequest(hConnect, 'POST', PWideChar(Path), nil, nil, nil, 0);
      if hRequest <> nil then begin
        // ВАЖНО: Передаем DataPtr напрямую, без преобразований в строку! [cite: 4, 11]
        if WinHttpSendRequest(hRequest, PWideChar(Headers), Length(Headers), DataPtr, DataLen, DataLen, nil) then begin
          WinHttpReceiveResponse(hRequest, nil);
          Print('Inventory (' + IntToStr(AList.TotalCount) + ' item(s)) was sent.');
        end;
        WinHttpCloseHandle(hRequest);
      end;
      WinHttpCloseHandle(hConnect);
    end;
    WinHttpCloseHandle(hSession);
  end;
end;

procedure main();
var j:integer;
    current_slot:cardinal;
    inv_list:array [0..1] of TInvList;
begin
    inv_list[0]:=TInvList.Create; 
    inv_list[1]:=TInvList.Create;
    current_slot:=0;
    while true do
    begin
            inv_list[current_slot].clear;
            for j := 0 to Inventory.User.Count - 1 do
                  inv_list[current_slot].Values[Inventory.User.Items(j).id] := inv_list[current_slot].Values[Inventory.User.Items(j).id] + Inventory.User.Items(j).count;

            if inv_list[0].CheckSum <> inv_list[1].CheckSum then
            begin
               
               SendInventory(inv_list[current_slot],GUID);
               current_slot := 1 - current_slot;
            end;

            delay(200);
    end;
end;

begin
    main();
end.