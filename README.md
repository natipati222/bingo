# Live Bingo

## Uruchomienie lokalne

1. Zainstaluj zależności: `npm install`
2. Uruchom serwer gry: `npm run server`
3. W drugim terminalu uruchom frontend: `npm run dev`
4. Otwórz adres pokazany przez Vite, domyślnie `http://localhost:5173`.

## Wdrożenie na Render

Repozytorium zawiera `render.yaml`, który konfiguruje jedną usługę Render:

- buduje frontend komendą `npm ci && npm run build`,
- uruchamia serwer Socket.IO i Express komendą `npm run server`,
- serwuje frontend i Socket.IO z tego samego publicznego adresu,
- zapisuje pokoje w trwałym dysku pod `/var/data`.

Aby opublikować grę:

1. Wypchnij repozytorium do GitHub lub GitLab.
2. W Render wybierz **New + → Blueprint** i połącz repozytorium.
3. Zatwierdź konfigurację z `render.yaml`.
4. Po zakończeniu wdrożenia otwórz publiczny adres usługi Render.

Konfiguracja Blueprint używa płatnego planu usługi i trwałego dysku. Są one
potrzebne, aby serwer działał publicznie przez cały czas i zachowywał stan pokoi
po restarcie. Bez trwałego dysku pokoje mogą zostać utracone przy ponownym
uruchomieniu usługi.
