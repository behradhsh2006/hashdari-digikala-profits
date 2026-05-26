
# برنامه پیاده‌سازی: سامانه جامع مدیریت موجودی، مالی و قیمت‌گذاری (فارسی RTL)

این یک پروژه بزرگ است. پیشنهاد می‌کنم آن را در ۴ فاز پیاده‌سازی کنیم تا هر بخش با کیفیت بالا تحویل داده شود. بعد از تأیید شما، فاز ۱ را شروع می‌کنم.

---

## فاز ۱ — احراز هویت Mock + RBAC + اسکلت اصلی (هسته برنامه)

**هدف:** ورود به سیستم به‌عنوان Admin یا Staff کار کند، سایدبار با دسترسی نقش‌محور نمایش داده شود.

- `src/lib/auth.ts` — احراز هویت Mock با LocalStorage (کاربران پیش‌فرض: `admin/admin` و `staff/staff`)
- `src/hooks/useAuth.tsx` — Context برای کاربر فعلی + نقش + permissions
- `src/lib/permissions.ts` — تعریف نقش‌ها (super_admin, manager, warehouse, viewer) و flagهای دسترسی (`canSeeFinancials`, `canManageUsers`, `canEditPricing`, ...)
- `src/components/Layout.tsx` — لایه RTL با Sidebar فارسی + Header (کاربر/خروج)
- `src/components/ProtectedRoute.tsx` — مخفی‌سازی منوها و صفحات بر اساس permission
- `src/routes/login.tsx` — صفحه ورود فارسی
- `src/routes/_authenticated.tsx` — Layout محافظت‌شده
- جابه‌جایی محتوای فعلی به `src/routes/_authenticated/pricing.tsx`
- صفحه `src/routes/_authenticated/users.tsx` — مدیریت کاربران (فقط Admin)
- فونت Vazirmatn فعلاً فعال است؛ بررسی و بهبود می‌شود.

## فاز ۲ — مدیریت موجودی هوشمند (مخصوص فروشگاه Surface)

- `src/hooks/useInventory.ts` — LocalStorage برای محصولات + شماره سریال
- `src/routes/_authenticated/inventory.tsx` — جدول محصولات با ستون‌های: نام، برند/مدل، CPU، RAM، Storage، رنگ، SKU، قیمت خرید (با ارز)، قیمت پایه فروش، حداقل موجودی هشدار
- `src/routes/_authenticated/serials.tsx` — مدیریت شماره سریال‌ها (وضعیت: موجود/فروخته شده/رزرو/گارانتی، انبار، تاریخ ورود شمسی)
- `src/components/BarcodeScanner.tsx` — اسکن QR/Barcode با دوربین موبایل (`html5-qrcode`) برای ورود/خروج سریع
- `src/routes/_authenticated/dashboard.tsx` — داشبورد: ارزش کل دارایی انبار، هشدارهای کمبود موجودی (فقط برای نقش‌های مجاز)
- تقویم شمسی برای تاریخ‌ها (`dayjs-jalali` یا `moment-jalaali`)

## فاز ۳ — قیمت‌گذاری پیشرفته + Excel + گزارش‌ها

- بازسازی ماشین‌حساب موجود با گزینه «سود به صورت مبلغ ثابت» یا «درصدی از قیمت خرید»
- نوار سراسری نرخ درهم (قبلاً ساخته شده) متصل به جدول محصولات
- دکمه «به‌روزرسانی قیمت‌ها» در صفحه موجودی (نسخه پیشرفته‌تر از فعلی)
- وارد کردن Excel/CSV برای محصولات و شماره سریال‌ها
- خروجی Excel برای تمام جدول‌ها (موجودی، مالی، قیمت‌گذاری)

## فاز ۴ — API دیجی‌کالا و یکپارچه‌سازی خارجی

- `src/routes/_authenticated/settings/digikala.tsx` — تنظیمات Token, Seller ID (ذخیره در LocalStorage)
- `src/routes/_authenticated/settings/external-api.tsx` — Endpoint و Token API خارجی
- `src/routes/_authenticated/commitments.tsx` — تعهدات ارسال امروز و دیروز (با Mock data)
- `src/routes/_authenticated/financials.tsx` — گزارش‌های مالی دیجی‌کالا: فروش ناخالص، کمیسیون، هزینه لجستیک، خالص پرداختی، تسویه‌حساب‌ها (Mock data)
- منطق fetch واقعی آماده است اما با endpointهای کاربر کار می‌کند

---

## ملاحظات فنی

- **پایگاه داده:** الان همه‌چیز LocalStorage است (طبق درخواست شما). اگر بعداً بخواهید پایداری واقعی + احراز هویت امن + همگام‌سازی چند کاربره، باید Lovable Cloud (Supabase) را فعال کنیم. توصیه می‌کنم بعد از فاز ۱.
- **API دیجی‌کالا:** چون مرورگر CORS را بلاک می‌کند، فراخوانی واقعی نیاز به یک server function دارد (با Lovable Cloud یا proxy). الان فقط Mock data نمایش می‌دهیم و UI آماده اتصال می‌ماند.
- **اسکن بارکد:** از `html5-qrcode` استفاده می‌کنم که در موبایل و دسکتاپ کار می‌کند.
- **تقویم شمسی:** از `dayjs` + `jalaliday` استفاده می‌کنم.

---

## درخواست تأیید

۱. آیا با اجرای فازبندی موافقید، یا می‌خواهید همه فازها در یک پاسخ ساخته شود؟ (هشدار: ساخت کامل در یک مرحله ممکن است کیفیت را کاهش دهد و فایل‌های زیادی تولید کند.)

۲. آیا می‌خواهید همین حالا **Lovable Cloud** را فعال کنم تا داده‌ها واقعاً ذخیره شوند و چند کاربر همزمان کار کنند؟ (پیشنهاد قوی برای یک سیستم enterprise — بدون آن، داده‌ها فقط در مرورگر هر کاربر می‌مانند.)

۳. ترتیب اولویت فازها برای شما درست است، یا فاز خاصی را زودتر می‌خواهید؟
