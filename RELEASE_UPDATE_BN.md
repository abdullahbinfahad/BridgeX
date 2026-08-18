# BridgeX সংশোধিত রিলিজ নির্দেশনা

BridgeX-এর ওয়েব সংস্করণ এখন `https://bridgex.abdullahbinfahad.info`-এ প্রকাশিত। হোমপেজ ও Marketplace এখন কেবল বাস্তব Supabase পোস্ট দেখায়; কোনো নমুনা পোস্ট, কাল্পনিক অর্ডার বা কাল্পনিক ব্যালেন্স দেখায় না। পোস্টে আপলোড করা ছবিগুলো প্রাইভেট স্টোরেজ থেকে অনুমোদিত ব্রাউজার ডাউনলোডের মাধ্যমে প্রদর্শিত হয়, তাই স্টোরেজ বালতি পাবলিক না করেও ছবি দেখা যায়।

ইমেইল-পাসওয়ার্ড ও Google সাইন-ইন সক্রিয়। লগইন হওয়ার পর উপরের ডান পাশে **Log in**-এর বদলে সদস্যের নাম ও avatar দেখা যাবে। সেই মেনু থেকে Dashboard, Profile edit, Admin control panel (admin হলে) ও Sign out ব্যবহার করা যাবে। Profile edit পেজ থেকে ছবি, নাম, ফোন, bio, বর্তমান সঠিক ঠিকানা, China address (বর্তমান দেশ China হলে), এবং home location পরিবর্তন করা যায়।

নতুন সদস্য প্রোফাইলের প্রথম ধাপ শেষ করে দ্বিতীয় ধাপের পরিচয় যাচাই এড়িয়ে যেতে পারবেন; এতে অ্যাকাউন্ট সক্রিয় থাকবে, তবে **Not verified** অবস্থায় থাকবে। পরিচয় যাচাই জমা দিতে National ID এবং Passport দুটোই প্রয়োজন; সদস্য Student status নির্বাচন করলে Student ID ও প্রতিষ্ঠানের নামও প্রয়োজন। পরিচয় যাচাই জমার আগে current এবং home location পূর্ণ থাকা বাধ্যতামূলক।

| বিষয় | বর্তমান অবস্থা | ব্যবহারকারীর করণীয় |
|---|---|---|
| ইমেইল-পাসওয়ার্ড | সক্রিয় | Access পেজ থেকে নিবন্ধন বা সাইন-ইন করুন। |
| Google সাইন-ইন | সক্রিয় | **Continue with Google** নির্বাচন করুন। |
| Facebook সাইন-ইন | এখনও চালু নয় | এটি ব্যবহারকারীর জন্য বিনামূল্যে হতে পারে, কিন্তু Meta Developer App, App ID, App Secret, ইমেইল অনুমতি এবং Supabase callback নিবন্ধন দরকার। [1] |
| Apple সাইন-ইন | এখনও চালু নয় | Apple Developer Program-এর সদস্যতা ও Apple OAuth credentials দরকার। Apple-এর প্রকাশিত তথ্য অনুযায়ী সাধারণ সদস্যতার মূল্য বছরে USD 99; অঞ্চলভেদে মূল্য ভিন্ন হতে পারে। [2] |
| Android APK | নতুন build সম্পন্ন | নিচের build link থেকে APK ইনস্টল করুন। এটি সরাসরি guest marketplace খুলবে, 1 cm সাদা উপরের ফাঁকা স্থান রাখবে, এবং দীর্ঘ loading overlay এড়াতে দ্রুত fallback ব্যবহার করবে। |

## বাস্তব পোস্ট, অফার ও অর্ডার ফ্লো

| কাজ | বর্তমান আচরণ |
|---|---|
| Item request | বাস্তব request পোস্ট করা হলে Homepage ও Marketplace-এ দেখা যায়। |
| Make an offer | Traveler নির্দিষ্ট item request খুলে amount, expected arrival ও note সহ বাস্তব pending offer পাঠাতে পারেন। |
| Send interest | Sender নির্দিষ্ট carry-space listing খুলে note সহ বাস্তব pending interest পাঠাতে পারেন। |
| অর্ডার প্রগ্রেস | Sender view: **Offer → Matched → China send → Traveler received → Transit → Delivered → Released**। Traveler view-তে China pickup ও নিজের গ্রহণের দৃষ্টিভঙ্গি দেখা যায়। |

## Administrator access

দুটি account এখন administrator role পেয়েছে: `abdullahbinfahad.abf@gmail.com` এবং `abdullahbinfahad.abf@proton.me`। এই account দিয়ে লগইন করে নিচের লিংক খুলুন:

`https://bridgex.abdullahbinfahad.info/admin`

Admin panel থেকে members, verification submissions, open reports, requests, carry listings এবং protected orders দেখা ও পরিচালনা করা যায়।

## APK ইনস্টল লিংক

`https://expo.dev/accounts/abdullahbinfahad/projects/bridgex/builds/3e218bd6-607e-4a58-9455-8c5feb2594b4`

পুরোনো APK থাকলে আগে সেটি আনইনস্টল করে এই নতুন build ইনস্টল করুন। লগইন বা প্রোফাইল-সম্পর্কিত সমস্যা হলে ওয়েব সংস্করণে একই কাজ পরীক্ষা করুন; APK এখন একই কাস্টম domain-এর public marketplace ব্যবহার করে।

## পরবর্তী প্রয়োজনীয় তথ্য

Facebook চালু করতে Meta Developer dashboard থেকে App ID এবং App Secret দরকার। Apple চালু করতে Apple Developer Program-এ enrolment শেষ করে Service ID, Team ID, Key ID এবং private key তৈরি করতে হবে। এই credential না পাওয়া পর্যন্ত Facebook বা Apple বোতাম দেখানো নিরাপদ নয়, কারণ তা ব্যবহারকারীকে ভাঙা login flow-তে পাঠাতে পারে।

## তথ্যসূত্র

[1] [Supabase — Login with Facebook](https://supabase.com/docs/guides/auth/social-login/auth-facebook)

[2] [Apple — Enroll in the Apple Developer Program](https://developer.apple.com/programs/enroll/)
