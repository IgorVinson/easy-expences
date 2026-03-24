# Google Auth Setup (Android + iOS)

## 1. Firebase Console
- Go to Firebase Console → Authentication → Sign-in method → Google → **Enable**
- Copy the **Web client ID** shown in the Google provider settings

## 2. Google Cloud Console — Create OAuth Client IDs
Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**

**Android:**
- Application type: Android
- Package name: `com.sayspend.app`
- SHA-1: run `eas credentials` to get it from your EAS keystore

**iOS:**
- Application type: iOS
- Bundle ID: `com.sayspend.app`

## 3. Fill in `.env`
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=        # from Firebase Console (step 1)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=   # from step 2 Android
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=       # from step 2 iOS
```

## 4. Add EAS Secrets (for CI/CD builds)
```bash
eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "..."
eas secret:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "..."
eas secret:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "..."
```

## 5. Rebuild
```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```
