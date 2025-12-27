uses SysUtils, Classes;

// Объявляем функции из системной библиотеки Windows
function WinHttpOpen(pwszUserAgent: PWideChar; dwAccessType: Cardinal; pwszProxyName: PWideChar; pwszProxyBypass: PWideChar; dwFlags: Cardinal): Pointer; stdcall; external 'winhttp.dll';
function WinHttpConnect(hSession: Pointer; pswzServerName: PWideChar; nServerPort: Integer; dwReserved: Cardinal): Pointer; stdcall; external 'winhttp.dll';
function WinHttpOpenRequest(hConnect: Pointer; pwszVerb: PWideChar; pwszObjectName: PWideChar; pwszVersion: PWideChar; pwszReferrer: PWideChar; rplpwszAcceptTypes: Pointer; dwFlags: Cardinal): Pointer; stdcall; external 'winhttp.dll';
function WinHttpSendRequest(hRequest: Pointer; pwszHeaders: PWideChar; dwHeadersLength: Cardinal; lpOptional: Pointer; dwOptionalLength: Cardinal; dwTotalLength: Cardinal; dwContext: Pointer): Boolean; stdcall; external 'winhttp.dll';
function WinHttpReceiveResponse(hRequest: Pointer; lpReserved: Pointer): Boolean; stdcall; external 'winhttp.dll';
function WinHttpCloseHandle(hInternet: Pointer): Boolean; stdcall; external 'winhttp.dll';

procedure SendDataToServer(const GUID, Payload: string);
var
  hSession, hConnect, hRequest: Pointer;
  ServerName, Path: widestring;
  Headers: widestring;
begin
  // Настройки подключения
  ServerName := 'localhost'; // Поменяйте на IP вашего сервера, когда будете тестировать не локально
  Path := '/update?guid=' + GUID;
  Headers := 'Content-Type: text/plain; charset=utf-8' + #13#10;

  hSession := WinHttpOpen('AdrenalineBotAgent', 1, nil, nil, 0);
  if hSession <> nil then begin
    hConnect := WinHttpConnect(hSession, PWideChar(ServerName), 5678, 0); // Порт 3000 как в Node.js
    if hConnect <> nil then begin
      hRequest := WinHttpOpenRequest(hConnect, 'POST', PWideChar(Path), nil, nil, nil, 0);
      if hRequest <> nil then begin
        // Отправляем данные
        if WinHttpSendRequest(hRequest, PWideChar(Headers), Length(Headers), Pointer(PAnsiChar(AnsiString(Payload))), Length(Payload), Length(Payload), nil) then begin
          WinHttpReceiveResponse(hRequest, nil);
          Print('Данные успешно отправлены!');
        end;
        WinHttpCloseHandle(hRequest);
      end;
      WinHttpCloseHandle(hConnect);
    end;
    WinHttpCloseHandle(hSession);
  end;
end;

begin
  Print('Запуск теста отправки...');
  // Тестовая отправка: GUID и "содержимое инвентаря"
  SendDataToServer('Daria-Master-777', 'Item1: 100, Item2: 500');
  Print('Тест завершен.');
  script.stop();
end.