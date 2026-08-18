# BridgeX প্রশাসক ও ব্যাকএন্ড পরিচালনা নির্দেশিকা

## ১. প্রশাসক লগইন ও কন্ট্রোল প্যানেল

প্রশাসক হিসেবে সাইন-ইন করার জন্য `https://bridgex.abdullahbinfahad.info/access` ব্যবহার করুন। `abdullahbinfahad.abf@gmail.com` অ্যাকাউন্টটি BridgeX-এর `admin` role পেয়েছে। সাইন-ইন শেষ হলে `https://bridgex.abdullahbinfahad.info/admin` খুলুন। এখানে আলাদা কোনো default password নেই; প্রশাসক অধিকার কেবল role দিয়ে নিয়ন্ত্রিত হয়।

| বিভাগ | প্রশাসকের কাজ |
|---|---|
| Users | সদস্যের role ও suspended status পর্যালোচনা; প্রয়োজন হলে account suspend বা restore করা। |
| Verification | জমা দেওয়া document approve, reject, অথবা অতিরিক্ত তথ্যের প্রয়োজন জানানো। |
| Reports | fraud, unsafe item, identity misuse, harassment বা অন্য অভিযোগ review করা। |
| Requests | নীতিমালা ভাঙা send request remove করা। |
| Carry listings | নীতিমালা ভাঙা carry/cargo listing remove করা। |

> Authentication user স্থায়ীভাবে মুছে ফেলা একটি irreversible action। এটি browser control panel থেকে নয়; Supabase Dashboard-এর Users area থেকে যথাযথ review করে করা উচিত।

## ২. যাচাই ও অভিযোগ পরিচালনা

BridgeX verification-এ প্রতিটি সদস্যের কাছ থেকে সব ধরনের পরিচয়পত্র একসাথে চাওয়া উচিত নয়। প্রাথমিক যাচাইয়ের জন্য **Bangladesh National ID অথবা Passport**-এর একটি গ্রহণ করা হয়। সদস্য যদি student status দাবি করেন, শুধু সেই ক্ষেত্রে Student ID নেওয়া হয়। এটি প্রয়োজনের অতিরিক্ত ব্যক্তিগত data সংগ্রহ কমায় এবং document exposure সীমিত রাখে।

Document এবং incident evidence private Supabase Storage-এ থাকে; নিজ account-এর owner এবং অনুমোদিত administrator ছাড়া অন্য user এটি পড়তে পারে না। রিপোর্ট পেলে administrator evidence review, account suspend, listing remove, escrow review বা প্রযোজ্য কর্তৃপক্ষকে তথ্য দেওয়ার জন্য case summary প্রস্তুত করতে পারেন। App থেকে স্বয়ংক্রিয়ভাবে police case file করা হয় না; আইনগত পদক্ষেপের আগে স্থানীয় আইনজীবী বা আইনশৃঙ্খলা কর্তৃপক্ষের নিয়ম অনুসরণ করতে হবে।

## ৩. সদস্য ও Guest নিয়ম

Guest user শুধু marketplace-এর post এবং detail দেখতে পারবেন। নতুন request/listing post, offer, message, order, verification, wallet ও document/media upload করার আগে email-password account দিয়ে sign-in লাগবে। Email-password flow Android WebView-এর ভেতরে চলার জন্য তৈরি করা হয়েছে, যাতে নিয়মিত login-এর জন্য mail app বা Chrome-এ যেতে না হয়।

## ৪. ব্যাকএন্ড কাঠামো

| স্তর | দায়িত্ব |
|---|---|
| Render | BridgeX React/Express web application, custom domain, TLS, Docker deployment। |
| Supabase Auth | Email-password account, session ও role-based authentication। |
| Supabase Postgres | profile, verification, request, carry listing এবং incident-report metadata। |
| Supabase Storage | private verification document ও private request-media files। |
| GitHub | source history; Render main branch update পেলে redeploy করে। |

## ৫. বর্তমান capacity ও বাস্তব সীমা

বর্তমান free-tier configuration prototype এবং low-traffic launch-এর জন্য উপযোগী, কিন্তু নির্দিষ্ট “কত user” capacity নিশ্চিত করে বলা যায় না। প্রকৃত capacity নির্ভর করে concurrent user, image/document upload size, database query, traffic location এবং Render cold start-এর উপর। Production launch-এর আগে load test চালিয়ে 95th-percentile response time, error rate ও storage growth মাপা উচিত।

| Component | বর্তমান প্রকাশিত সীমা | BridgeX-এ প্রভাব |
|---|---|---|
| Render Free Web Service | 512 MB RAM, 0.1 CPU; 15 মিনিট idle হলে spin down এবং পরের request-এ প্রায় এক মিনিট start হতে পারে। | APK/web প্রথম request ধীর হতে পারে; serious production workload-এর জন্য paid service দরকার। |
| Supabase Free | 50,000 MAU, 500 MB database, 1 GB file storage, 5 GB egress; inactivity-তে project pause হতে পারে। | Document upload দ্রুত storage quota ব্যবহার করতে পারে; file retention ও upgrade budget পরিকল্পনা করুন। |
| Render Free scaling | Single instance; horizontal scaling নেই। | Traffic spike বা বড় upload campaign-এর জন্য free plan যথেষ্ট নয়। |

### Production upgrade trigger

একসাথে অনেক active user, নিয়মিত document upload, escrow/order activity, অথবা acceptable first-load time প্রয়োজন হলে Render Starter/Standard এবং Supabase Pro-তে upgrade করা উচিত। Render-এর paid instance spin-down সীমাবদ্ধতা দূর করে; Supabase Pro backup, larger storage এবং stronger operational headroom দেয়।

## References

[1]: https://render.com/docs/free "Render — Deploy for Free"

[2]: https://render.com/pricing "Render Pricing"

[3]: https://supabase.com/pricing "Supabase Pricing"
