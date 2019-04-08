# FHP Speiseplan Bot

Ein Telegram Bot für die Mensa Kiepenheueralle der Fachhochschule Potsdam.

[FH;P Speiseplan Bot](https://t.me/FHPSpeiseplanBot)

### Installing
Installiert dieses Respoitory, indem ihr es herunterladet, entpackt und dann mit npm alle dependencies installiert.

```
npm install
```

## Bot deployment auf eurer local Machine
Um den Bot auf eurer local Machine zum Laufen zu bringen benötigt ihr lediglich einen Bot Token für euren Bot vom [BotFather](https://telegram.me/BotFather).
Der Bot lässt sich dann mit eurem Token starten.

```
BOT_TOKEN='$BOT_TOKEN' npm start
```

## Bot deployment auf einem Server

Zum jetzigen Zeitpunkt läuft der Bot auf dem [ZEIT.co Deployment Service](https://www.zeit.co). Ihr könnt diesen Bot modifizieren und selbst auf dem Server hosten. Zum Starten benötigt ihr folgenden command.

```
now -e BOT_TOKEN='$BOT_TOKEN'
```

Meißtens schaltet sich die Zeit App nach einiger Zeit wieder ab. Um eine kontinuierliche runtime zu gewährleisten müsst ihr euren App Status setzen. Den $NOW_BOT_DOMAIN findet ihr auf eurem [ZEIT.co Dashboard](https://zeit.co/dashboard/instances).

```
now scale $NOW_BOT_DOMAIN 1
```

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.
