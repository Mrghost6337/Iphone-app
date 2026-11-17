# Bord – Expo Go-versie (SDK 58)

Een iPhone-app om voeding te scannen. Je fotografeert je maaltijd, Claude AI herkent wat erop staat en Bord rekent de kcal, het eiwit, de koolhydraten en het vet uit. Daarnaast heeft de app een barcodescanner met Open Food Facts, recepten die je stap voor stap volgt, vrienden die je via een QR-code toevoegt en een puntenranglijst.

## Op je iPhone draaien (in ongeveer 2 minuten)
1. Installeer **Expo Go** uit de App Store. Het moet de nieuwste versie zijn, die SDK 58 ondersteunt.
2. Installeer **Node.js 20 of hoger** op je computer.
3. Voer in deze map het volgende uit:
   ```bash
   npm install
   npx expo start
   ```
4. Scan de QR-code in de terminal met de **Camera-app** van je iPhone. De app opent dan in Expo Go.
   - Zitten je computer en je iPhone niet op hetzelfde wifi-netwerk? Gebruik dan `npx expo start --tunnel`.

## Problemen oplossen
- **"Project is incompatible with this version of Expo Go"**: werk Expo Go bij in de App Store. Dit project gebruikt SDK 58, de nieuwste versie.
- **De QR-code laadt niet of blijft hangen**: zorg dat je iPhone en computer op hetzelfde wifi-netwerk zitten, of gebruik `npx expo start --tunnel`. Schudden in Expo Go → Reload laadt de app opnieuw.
- **Camera of foto's weigeren**: geef in iOS Instellingen → Expo Go toestemming voor Camera en Foto's.
- **De app opnieuw beginnen**: Instellingen in de app → Alles wissen.

## AI-fotoherkenning
Ga naar Instellingen → AI-sleutel en vul je eigen Anthropic API-sleutel in. De sleutel blijft in de iOS-sleutelhanger (SecureStore) op je toestel en zit nooit in de code. Zonder sleutel werken barcode, zoeken en beschrijven gewoon. Alleen de herkenning van foto's heeft de sleutel nodig.

## Wat werkt in Expo Go
Onboarding (20 stappen), camera, barcode, de AI-scan, correcties, het dashboard, water, vooruitgang, gewicht, recepten met checklists en timers, posten, liken, comments, vrienden via QR, de ranglijst, instellingen, profielfoto, meldingen, CSV-export en de donkere modus.

## Wat Expo Go níet kan (Apple-beperking, geen bug)
- **Widgets, Live Activities, de echte Dynamic Island en Siri** hebben een eigen app-build nodig (`npx expo prebuild` en EAS Build) of de SwiftUI-versie in `Bord/`. In Expo Go zie je daarvoor een eigen "island" bovenaan het scherm.
- **De community en vrienden** werken nu lokaal of via de QR-code. Om ze live te delen met anderen is een server nodig, en die komt bij de launch.
