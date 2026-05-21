Apple — App Store Connect (iOS)
Prerequisite: Your subscription product must be approved (which it is, since you're live).

App Store Connect → your app → left sidebar: Subscriptions
Click your subscription group → click the specific product (e.g., Premium Annual)
Scroll down to Offer Codes section → click Create Offer Codes
Create a campaign:
Reference Name: Launch 50 (internal only)
Customer Eligibility: New Subscribers
Offer Type: Free (or Pay Up Front with discount)
Duration: e.g., 1 month free
After campaign is created, generate codes → pick Custom Code:
Custom Code: type LAUNCH50
Maximum Redemptions: e.g., 1,000
Expiration Date: set one
Submit → goes through brief review (usually hours, sometimes a day)
You can also generate a redemption URL Apple gives you, like https://apps.apple.com/redeem?ctx=offercodes&id=YOUR_APP_ID&code=LAUNCH50 — tap the link and Apple's sheet opens pre-filled. Great for Telegram.

Google Play Console (Android)
Play Console → your app → left sidebar: Monetize → Promotions → Promo codes
Click Create promo code
Choose One promo code (the multi-use type) — not "one-time use codes" (those generate a CSV of unique codes)
Fill in:
Promo code: LAUNCH50
Add product: select your subscription SKU (e.g., premium_annual)
Discount: Free / percentage / fixed
Max redemptions: e.g., 500
Expiration: set one
Save — active immediately, no review
RevenueCat — nothing to do
You don't configure codes in RevenueCat. The SDK code we wrote already handles redemption:

iOS: presentCodeRedemptionSheet() → user types LAUNCH50 in Apple's sheet
Android: Purchases.redeemCode("LAUNCH50") → silent server-side redemption
After redemption, RC detects the entitlement and your existing tier-sync logic flips them to premium. No dashboard config needed.

Gotcha to know
Apple's redemption sheet ignores anything the user types in your in-app TextInput — it opens its own sheet. So on iOS, you might want the flow to be: hand out the redemption URL via Telegram (not the bare code), so they tap and the sheet auto-fills. On Android, the typed code works directly.

Want me to gate the iOS input differently — e.g., show a "Tap to redeem" button on iOS that just calls presentCodeRedemptionSheet() without expecting them to type, while keeping the typed flow on Android?
