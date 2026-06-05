# Tatra banka Tavern

Brandovaná fantasy-tech barmanská hra pre interné podujatia Tatra banka.
Hra používa statické HTML, CSS a JavaScript bez build kroku.

## Run locally

From the project root:

```bash
cd "/Users/vladshudegov/Zav_zadanie 2"
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000
```

You can also use PHP's built-in server:

```bash
cd "/Users/vladshudegov/Zav_zadanie 2"
php -S 127.0.0.1:8000
```

## Important

Do not open `index.html` directly as `file://.../index.html`.

The game loads level data from `src/js/data/levels.json`, so opening the file directly can cause browser security restrictions and the game will only work partially.
