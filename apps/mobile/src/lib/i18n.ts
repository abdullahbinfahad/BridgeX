import { createContext, createElement, useContext } from "react";
import type { ReactNode } from "react";

export const NATIVE_LANGUAGES = ["en", "zh-CN", "fr", "es", "de", "ar", "ja", "ko", "bn", "hi", "ur"] as const;
export type NativeLanguage = (typeof NATIVE_LANGUAGES)[number];

const english = {
  marketplace: "Marketplace",
  workspace: "Workspace",
  messages: "Messages",
  updates: "Updates",
  more: "More",
  profile: "Profile",
  payments: "Payments",
  postDetails: "Post details",
  signIn: "Sign in",
  signInToContinue: "Sign in to continue",
  signInProfile: "Sign in to manage your profile",
  signInUpdates: "Sign in to view your updates",
  search: "Search route, item, or member",
  requests: "Requests",
  carrySpace: "Carry space",
  allCategories: "All categories",
  chooseCategories: "Choose product categories",
  paymentRecords: "Payment records",
  inbox: "Inbox",
  bridgeXAdmin: "BridgeX Admin",
  protectedDeals: "Accepted protected deals",
  supportConversation: "Private support conversation",
  language: "Language",
  appearance: "Appearance",
  system: "System",
  light: "Light",
  dark: "Dark",
  saveProfile: "Save profile details",
  profileSaved: "Profile details saved.",
  refreshPosts: "Refresh posts",
  loadingPosts: "Loading live BridgeX posts…",
  noPosts: "No matching posts yet",
  details: "Details",
  send: "Send",
  writeMessage: "Write a message…",
} as const;

type NativeTranslationKey = keyof typeof english;
type Catalog = Partial<Record<NativeTranslationKey, string>>;

const catalog: Record<NativeLanguage, Catalog> = {
  en: english,
  "zh-CN": { marketplace: "市场", workspace: "工作区", messages: "消息", updates: "更新", more: "更多", profile: "资料", payments: "付款", postDetails: "帖子详情", signIn: "登录", signInToContinue: "登录以继续", signInProfile: "登录以管理您的资料", signInUpdates: "登录以查看更新", search: "搜索路线、物品或会员", requests: "需求", carrySpace: "携带空间", allCategories: "全部分类", chooseCategories: "选择商品分类", paymentRecords: "付款记录", inbox: "收件箱", bridgeXAdmin: "BridgeX 管理员", protectedDeals: "已接受的受保护交易", supportConversation: "私人支持对话", language: "语言", appearance: "外观", system: "系统", light: "浅色", dark: "深色", saveProfile: "保存资料", profileSaved: "资料已保存。", refreshPosts: "刷新帖子", loadingPosts: "正在加载 BridgeX 帖子…", noPosts: "暂无匹配帖子", details: "详情", send: "发送", writeMessage: "输入消息…" },
  bn: { marketplace: "মার্কেটপ্লেস", workspace: "ওয়ার্কস্পেস", messages: "বার্তা", updates: "আপডেট", more: "আরও", profile: "প্রোফাইল", payments: "পেমেন্ট", postDetails: "পোস্টের বিবরণ", signIn: "লগ ইন", signInToContinue: "চালিয়ে যেতে লগ ইন করুন", signInProfile: "প্রোফাইল পরিচালনা করতে লগ ইন করুন", signInUpdates: "আপডেট দেখতে লগ ইন করুন", search: "রুট, পণ্য বা সদস্য খুঁজুন", requests: "অনুরোধ", carrySpace: "বহন করার জায়গা", allCategories: "সব বিভাগ", chooseCategories: "পণ্য বিভাগ নির্বাচন করুন", paymentRecords: "পেমেন্ট রেকর্ড", inbox: "ইনবক্স", bridgeXAdmin: "BridgeX অ্যাডমিন", protectedDeals: "গৃহীত সুরক্ষিত ডিল", supportConversation: "ব্যক্তিগত সহায়তা কথোপকথন", language: "ভাষা", appearance: "রূপ", system: "সিস্টেম", light: "হালকা", dark: "গাঢ়", saveProfile: "প্রোফাইল সংরক্ষণ করুন", profileSaved: "প্রোফাইল সংরক্ষিত হয়েছে।", refreshPosts: "পোস্ট রিফ্রেশ করুন", loadingPosts: "লাইভ BridgeX পোস্ট লোড হচ্ছে…", noPosts: "কোনো মিল পাওয়া যায়নি", details: "বিস্তারিত", send: "পাঠান", writeMessage: "বার্তা লিখুন…" },
  ar: { marketplace: "السوق", workspace: "مساحة العمل", messages: "الرسائل", updates: "التحديثات", more: "المزيد", profile: "الملف الشخصي", payments: "المدفوعات", postDetails: "تفاصيل المنشور", signIn: "تسجيل الدخول", signInToContinue: "سجّل الدخول للمتابعة", signInProfile: "سجّل الدخول لإدارة ملفك", signInUpdates: "سجّل الدخول لعرض التحديثات", search: "ابحث عن مسار أو منتج أو عضو", requests: "الطلبات", carrySpace: "مساحة حمل", allCategories: "كل الفئات", chooseCategories: "اختر فئات المنتجات", paymentRecords: "سجلات الدفع", inbox: "البريد الوارد", bridgeXAdmin: "إدارة BridgeX", protectedDeals: "الصفقات المحمية المقبولة", supportConversation: "محادثة دعم خاصة", language: "اللغة", appearance: "المظهر", system: "النظام", light: "فاتح", dark: "داكن", saveProfile: "حفظ الملف", profileSaved: "تم حفظ الملف.", refreshPosts: "تحديث المنشورات", loadingPosts: "جارٍ تحميل منشورات BridgeX…", noPosts: "لا توجد منشورات مطابقة", details: "التفاصيل", send: "إرسال", writeMessage: "اكتب رسالة…" },
  fr: { marketplace: "Marché", workspace: "Espace de travail", messages: "Messages", updates: "Mises à jour", more: "Plus", profile: "Profil", payments: "Paiements", signIn: "Se connecter", requests: "Demandes", carrySpace: "Espace de transport", inbox: "Boîte de réception", bridgeXAdmin: "Administrateur BridgeX", language: "Langue", appearance: "Apparence", light: "Clair", dark: "Sombre", saveProfile: "Enregistrer le profil", refreshPosts: "Actualiser les publications", details: "Détails", send: "Envoyer" },
  es: { marketplace: "Mercado", workspace: "Espacio de trabajo", messages: "Mensajes", updates: "Actualizaciones", more: "Más", profile: "Perfil", payments: "Pagos", signIn: "Iniciar sesión", requests: "Solicitudes", carrySpace: "Espacio de transporte", inbox: "Bandeja de entrada", bridgeXAdmin: "Administrador de BridgeX", language: "Idioma", appearance: "Apariencia", light: "Claro", dark: "Oscuro", saveProfile: "Guardar perfil", refreshPosts: "Actualizar publicaciones", details: "Detalles", send: "Enviar" },
  de: { marketplace: "Marktplatz", workspace: "Arbeitsbereich", messages: "Nachrichten", updates: "Aktualisierungen", more: "Mehr", profile: "Profil", payments: "Zahlungen", signIn: "Anmelden", requests: "Anfragen", carrySpace: "Transportraum", inbox: "Posteingang", bridgeXAdmin: "BridgeX-Administrator", language: "Sprache", appearance: "Darstellung", light: "Hell", dark: "Dunkel", saveProfile: "Profil speichern", refreshPosts: "Beiträge aktualisieren", details: "Details", send: "Senden" },
  ja: { marketplace: "マーケット", workspace: "ワークスペース", messages: "メッセージ", updates: "更新", more: "その他", profile: "プロフィール", payments: "支払い", signIn: "ログイン", requests: "依頼", carrySpace: "運搬スペース", inbox: "受信トレイ", bridgeXAdmin: "BridgeX 管理者", language: "言語", appearance: "外観", light: "ライト", dark: "ダーク", saveProfile: "プロフィールを保存", refreshPosts: "投稿を更新", details: "詳細", send: "送信" },
  ko: { marketplace: "마켓플레이스", workspace: "작업 공간", messages: "메시지", updates: "업데이트", more: "더보기", profile: "프로필", payments: "결제", signIn: "로그인", requests: "요청", carrySpace: "운반 공간", inbox: "받은편지함", bridgeXAdmin: "BridgeX 관리자", language: "언어", appearance: "화면", light: "라이트", dark: "다크", saveProfile: "프로필 저장", refreshPosts: "게시물 새로고침", details: "세부정보", send: "보내기" },
  hi: { marketplace: "बाज़ार", workspace: "कार्यस्थान", messages: "संदेश", updates: "अपडेट", more: "और", profile: "प्रोफ़ाइल", payments: "भुगतान", signIn: "साइन इन", requests: "अनुरोध", carrySpace: "ले जाने की जगह", inbox: "इनबॉक्स", bridgeXAdmin: "BridgeX व्यवस्थापक", language: "भाषा", appearance: "रूप", light: "हल्का", dark: "गहरा", saveProfile: "प्रोफ़ाइल सहेजें", refreshPosts: "पोस्ट रीफ़्रेश करें", details: "विवरण", send: "भेजें" },
  ur: { marketplace: "مارکیٹ پلیس", workspace: "ورک اسپیس", messages: "پیغامات", updates: "اپ ڈیٹس", more: "مزید", profile: "پروفائل", payments: "ادائیگیاں", signIn: "سائن اِن", requests: "درخواستیں", carrySpace: "لے جانے کی جگہ", inbox: "ان باکس", bridgeXAdmin: "BridgeX منتظم", language: "زبان", appearance: "ظاہری شکل", light: "روشن", dark: "گہرا", saveProfile: "پروفائل محفوظ کریں", refreshPosts: "پوسٹس ریفریش کریں", details: "تفصیلات", send: "بھیجیں" },
};

export function translate(language: string | null | undefined, key: NativeTranslationKey) {
  const normalized = NATIVE_LANGUAGES.includes(language as NativeLanguage) ? language as NativeLanguage : "en";
  return catalog[normalized][key] || english[key];
}

type NativeLanguageContextValue = { language: NativeLanguage; t: (key: NativeTranslationKey) => string; isRtl: boolean };
const NativeLanguageContext = createContext<NativeLanguageContextValue>({ language: "en", t: key => english[key], isRtl: false });

export function NativeLanguageProvider({ language, children }: { language: string | null | undefined; children: ReactNode }) {
  const normalized = NATIVE_LANGUAGES.includes(language as NativeLanguage) ? language as NativeLanguage : "en";
  return createElement(NativeLanguageContext.Provider, { value: { language: normalized, t: (key: NativeTranslationKey) => translate(normalized, key), isRtl: normalized === "ar" || normalized === "ur" } }, children);
}

export function useNativeLanguage() { return useContext(NativeLanguageContext); }
