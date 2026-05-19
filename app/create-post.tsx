import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { StackHeader } from "@/components/ui/StackHeader";
import { createCommunityPost, type CommunityPostType, type CommunityVisibility } from "@/services/community";
import { mockPerfumes } from "@/services/mock-data";
import { getPerfumes } from "@/services/perfumes";
import { captureFromCamera, pickFromLibrary } from "@/services/scan/imagePrep";
import { useUserStore } from "@/stores/useUserStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { triggerHaptic } from "@/utils/haptics";
import { useI18n } from "@/utils/i18n";

const POST_TYPES: CommunityPostType[] = [
  "fotd",
  "review",
  "question",
  "layering",
  "worth_it",
];

const TYPES_WITH_REQUIRED_SECOND = new Set<CommunityPostType>(["comparison", "layering"]);
const TYPES_WITH_REQUIRED_PRIMARY = new Set<CommunityPostType>(["fotd", "new_bottle", "review", "layering", "comparison", "worth_it"]);
const VISIBILITIES: CommunityVisibility[] = ["public", "followers", "private"];

type CreateStep = 1 | 2 | 3;
type BoxPapersValue = "yes" | "no" | "unknown";

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    perfumeId?: string;
    type?: CommunityPostType;
    starter?: string;
  }>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { language } = useI18n();
  const profile = useUserStore((state) => state.profile);

  const [step, setStep] = useState<CreateStep>(1);
  const [postType, setPostType] = useState<CommunityPostType>("review");
  const [visibility, setVisibility] = useState<CommunityVisibility>("public");

  const [catalogPerfumes, setCatalogPerfumes] = useState(mockPerfumes.slice(0, 36));
  const [perfumeSearch, setPerfumeSearch] = useState("");
  const [primaryPerfumeId, setPrimaryPerfumeId] = useState<string | undefined>(undefined);
  const [secondaryPerfumeId, setSecondaryPerfumeId] = useState<string | undefined>(undefined);

  const [selectedMediaUri, setSelectedMediaUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const [pricePaid, setPricePaid] = useState("");
  const [conditionValue, setConditionValue] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [boxPapers, setBoxPapers] = useState<BoxPapersValue>("unknown");
  const [comparisonQuestion, setComparisonQuestion] = useState("");
  const [layeringOrder, setLayeringOrder] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [showSubmittingOverlay, setShowSubmittingOverlay] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  const [showAiSheet, setShowAiSheet] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOptions, setAiOptions] = useState<string[]>([]);

  const autoStepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoStepTimerRef.current) {
        clearTimeout(autoStepTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      const perfumes = await getPerfumes(60);
      if (perfumes.length > 0) {
        setCatalogPerfumes(perfumes);
      }
    })();
  }, []);

  const copy = language === "tr"
    ? {
      title: "Paylaşım Oluştur",
      subtitle: "Ekle",
      step1: "1) Tür",
      step2: "2) Parfüm",
      step3: "3) İçerik",
      questionType: "Ne paylaşmak istiyorsun?",
      questionPerfume: "Parfüm seç",
      questionSecondPerfume: "İkinci parfümü seç",
      linkedPerfumeTitle: "Bağlı Parfüm",
      linkedPerfumeEmpty: "Bu gönderiye henüz parfüm bağlanmadı.",
      linkedPerfumeRequired: "Bu paylaşım türünde en az 1 parfüm seçmelisin.",
      linkedPerfumeOptional: "İstersen bu gönderiyi bir parfümle ilişkilendir.",
      linkedPerfumeSelect: "Parfüm Seç",
      linkedPerfumeChange: "Parfümü Değiştir",
      questionCaption: "Ne anlatmak istiyorsun?",
      questionVisibility: "Kim görsün?",
      searchPlaceholder: "Marka, model, notalar...",
      continue: "Devam Et",
      continueWithoutPerfume: "Parfümsüz devam et",
      pickFirstPerfume: "İlk parfümü seç",
      pickSecondPerfume: "İkinci parfümü seç",
      publish: "Paylaş",
      cancel: "Vazgeç",
      openCamera: "Kamera",
      openLibrary: "Fotoğraflar",
      openFiles: "Dosyalar",
      removeMedia: "Medyayı Kaldır",
      mediaHint: "1080x1350 veya 1350x1080 önerilir.",
      permissionTitle: "İzin Gerekli",
      permissionBody: "Medya seçmek için izin vermen gerekiyor. Ayarlardan erişimi açabilirsin.",
      openSettings: "Ayarları Aç",
      close: "Kapat",
      needCaption: "Açıklama en az 10 karakter olmalı.",
      successBody: "Paylaşım yayınlandı",
      submitErrorTitle: "Paylaşım başarısız",
      submitErrorBody: "Gönderi şu an paylaşılamadı. Bağlantını kontrol edip tekrar dene.",
      mediaErrorTitle: "Medya seçilemedi",
      mediaErrorBody: "Görsel alınamadı. Lütfen tekrar dene.",
      discardTitle: "Taslak silinsin mi?",
      discardBody: "Kaydedilmemiş değişikliklerin var. Bu ekrandan çıkılsın mı?",
      stay: "Kal",
      leave: "Çık",
      preview: "Önizleme",
      draftSaved: "Taslak kaydedildi",
      chars: "karakter",
      minChar: "min 10",
      visibilityPublic: "Herkese Açık",
      visibilityFollowers: "Sadece Takipçiler",
      visibilityPrivate: "Gizli",
      aiWrite: "AI ile yaz",
      aiGenerate: "3 Ton Oluştur",
      aiPremium: "Premium",
      aiFriendly: "Samimi",
      aiTechnical: "Teknik",
      aiUse: "Bu tonu kullan",
      aiLoading: "Tonlar hazırlanıyor...",
      buyInfoTitle: "Alınır mı? Bilgileri",
      buyPrice: "Satış Fiyatı",
      buyCondition: "Durum",
      buyBatch: "Batch / Kod",
      buyBox: "Kutu & Belge",
      boxYes: "Var",
      boxNo: "Yok",
      boxUnknown: "Bilmiyorum",
      comparisonTitle: "Karşılaştırma Sorusu",
      layeringTitle: "Katmanlama Sırası",
      loadingTitle: "Paylaşım hazırlanıyor...",
      loadingBody: "Görsel yükleniyor ve gönderi yayınlanıyor.",
      mention: "@/brand etiketi ekle",
      typeLabels: {
        fotd: "FOTD",
        new_bottle: "Yeni Parfüm",
        review: "İnceleme",
        question: "Soru",
        layering: "Katmanlama",
        comparison: "Karşılaştırma",
        worth_it: "Alınır mı?",
        sotd: "FOTD",
      } as Record<CommunityPostType, string>,
    }
    : {
      title: "Create Post",
      subtitle: "Add",
      step1: "1) Type",
      step2: "2) Perfume",
      step3: "3) Compose",
      questionType: "What do you want to share?",
      questionPerfume: "Pick perfume",
      questionSecondPerfume: "Pick second perfume",
      linkedPerfumeTitle: "Linked Perfume",
      linkedPerfumeEmpty: "No perfume linked to this post yet.",
      linkedPerfumeRequired: "This post type needs at least one perfume.",
      linkedPerfumeOptional: "Optionally link this post to a perfume.",
      linkedPerfumeSelect: "Pick Perfume",
      linkedPerfumeChange: "Change Perfume",
      questionCaption: "What do you want to tell?",
      questionVisibility: "Who can see this?",
      searchPlaceholder: "Brand, name, notes...",
      continue: "Continue",
      continueWithoutPerfume: "Continue without perfume",
      pickFirstPerfume: "Pick first perfume",
      pickSecondPerfume: "Pick second perfume",
      publish: "Publish",
      cancel: "Cancel",
      openCamera: "Camera",
      openLibrary: "Photos",
      openFiles: "Files",
      removeMedia: "Remove Media",
      mediaHint: "1080x1350 or 1350x1080 is recommended.",
      permissionTitle: "Permission Needed",
      permissionBody: "Please allow media access from Settings to continue.",
      openSettings: "Open Settings",
      close: "Close",
      needCaption: "Caption should be at least 10 characters.",
      successBody: "Post published",
      submitErrorTitle: "Publish failed",
      submitErrorBody: "We could not publish your post right now. Check your connection and try again.",
      mediaErrorTitle: "Media not selected",
      mediaErrorBody: "Could not load selected image. Please try again.",
      discardTitle: "Discard draft?",
      discardBody: "You have unsaved changes. Leave this screen?",
      stay: "Stay",
      leave: "Leave",
      preview: "Preview",
      draftSaved: "Draft saved",
      chars: "chars",
      minChar: "min 10",
      visibilityPublic: "Public",
      visibilityFollowers: "Followers only",
      visibilityPrivate: "Private",
      aiWrite: "Write with AI",
      aiGenerate: "Generate 3 Tones",
      aiPremium: "Premium",
      aiFriendly: "Friendly",
      aiTechnical: "Technical",
      aiUse: "Use this tone",
      aiLoading: "Generating tones...",
      buyInfoTitle: "Worth it context",
      buyPrice: "Asking price",
      buyCondition: "Condition",
      buyBatch: "Batch / Code",
      buyBox: "Box & Papers",
      boxYes: "Yes",
      boxNo: "No",
      boxUnknown: "Unknown",
      comparisonTitle: "Comparison Question",
      layeringTitle: "Layering Order",
      loadingTitle: "Preparing your post...",
      loadingBody: "Uploading media and publishing post.",
      mention: "Add @brand mention",
      typeLabels: {
        fotd: "FOTD",
        new_bottle: "New Bottle",
        review: "Review",
        question: "Question",
        layering: "Layering",
        comparison: "Comparison",
        worth_it: "Worth It?",
        sotd: "FOTD",
      } as Record<CommunityPostType, string>,
    };

  const draftKey = useMemo(
    () => `scentify:create-post:draft:${profile?.id ?? "anon"}`,
    [profile?.id],
  );

  const filteredPerfumes = useMemo(() => {
    const q = perfumeSearch.trim().toLowerCase();
    if (!q) return catalogPerfumes.slice(0, 30);
    return catalogPerfumes
      .filter((perfume) => `${perfume.brand} ${perfume.name} ${perfume.concentration ?? ""}`.toLowerCase().includes(q))
      .slice(0, 40);
  }, [catalogPerfumes, perfumeSearch]);

  const primaryPerfume = useMemo(
    () => catalogPerfumes.find((perfume) => perfume.id === primaryPerfumeId),
    [catalogPerfumes, primaryPerfumeId],
  );
  const secondaryPerfume = useMemo(
    () => catalogPerfumes.find((perfume) => perfume.id === secondaryPerfumeId),
    [catalogPerfumes, secondaryPerfumeId],
  );

  const requiresSecond = TYPES_WITH_REQUIRED_SECOND.has(postType);
  const requiresPrimary = TYPES_WITH_REQUIRED_PRIMARY.has(postType);
  const captionLength = caption.trim().length;
  const hasUnsavedChanges =
    caption.trim().length > 0 ||
    !!selectedMediaUri ||
    !!primaryPerfumeId ||
    !!secondaryPerfumeId ||
    pricePaid.trim().length > 0 ||
    conditionValue.trim().length > 0 ||
    batchCode.trim().length > 0 ||
    comparisonQuestion.trim().length > 0 ||
    layeringOrder.trim().length > 0;

  const canContinueFromStep2 = requiresSecond
    ? Boolean(primaryPerfumeId && secondaryPerfumeId)
    : (!requiresPrimary || Boolean(primaryPerfumeId));

  const canPublish = (() => {
    if (captionLength < 10 || submitting) return false;
    if (requiresPrimary && !primaryPerfumeId) return false;
    if (requiresSecond && !secondaryPerfumeId) return false;
    if (postType === "comparison" && comparisonQuestion.trim().length < 8) return false;
    if (postType === "layering" && layeringOrder.trim().length < 4) return false;
    return true;
  })();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(draftKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<{
          step: CreateStep;
          postType: CommunityPostType;
          visibility: CommunityVisibility;
          perfumeSearch: string;
          primaryPerfumeId: string;
          secondaryPerfumeId: string;
          selectedMediaUri: string | null;
          caption: string;
          pricePaid: string;
          conditionValue: string;
          batchCode: string;
          boxPapers: BoxPapersValue;
          comparisonQuestion: string;
          layeringOrder: string;
        }>;
        if (parsed.step) setStep(parsed.step);
        if (parsed.postType) setPostType(parsed.postType);
        if (parsed.visibility) setVisibility(parsed.visibility);
        if (parsed.perfumeSearch) setPerfumeSearch(parsed.perfumeSearch);
        if (parsed.primaryPerfumeId) setPrimaryPerfumeId(parsed.primaryPerfumeId);
        if (parsed.secondaryPerfumeId) setSecondaryPerfumeId(parsed.secondaryPerfumeId);
        if (typeof parsed.selectedMediaUri === "string") setSelectedMediaUri(parsed.selectedMediaUri);
        if (parsed.caption) setCaption(parsed.caption);
        if (parsed.pricePaid) setPricePaid(parsed.pricePaid);
        if (parsed.conditionValue) setConditionValue(parsed.conditionValue);
        if (parsed.batchCode) setBatchCode(parsed.batchCode);
        if (parsed.boxPapers) setBoxPapers(parsed.boxPapers);
        if (parsed.comparisonQuestion) setComparisonQuestion(parsed.comparisonQuestion);
        if (parsed.layeringOrder) setLayeringOrder(parsed.layeringOrder);
      } catch {}
      setIsDraftLoaded(true);
    })();
  }, [draftKey]);

  useEffect(() => {
    if (!params.perfumeId) return;
    setPrimaryPerfumeId(params.perfumeId);
  }, [params.perfumeId]);

  useEffect(() => {
    if (!params.type || !POST_TYPES.includes(params.type)) return;
    setPostType(params.type);
  }, [params.type]);

  useEffect(() => {
    const starter = params.starter?.trim();
    if (!starter || caption.trim().length > 0) return;
    setCaption(starter);
  }, [caption, params.starter]);

  useEffect(() => {
    if (!isDraftLoaded) return;
    const payload = JSON.stringify({
      step,
      postType,
      visibility,
      perfumeSearch,
      primaryPerfumeId,
      secondaryPerfumeId,
      selectedMediaUri,
      caption,
      pricePaid,
      conditionValue,
      batchCode,
      boxPapers,
      comparisonQuestion,
      layeringOrder,
      updatedAt: new Date().toISOString(),
    });
    void AsyncStorage.setItem(draftKey, payload);
  }, [
    batchCode,
    boxPapers,
    caption,
    comparisonQuestion,
    conditionValue,
    draftKey,
    isDraftLoaded,
    layeringOrder,
    perfumeSearch,
    postType,
    pricePaid,
    primaryPerfumeId,
    secondaryPerfumeId,
    selectedMediaUri,
    step,
    visibility,
  ]);

  useEffect(() => {
    const listener = navigation.addListener("beforeRemove", (event) => {
      if (!hasUnsavedChanges || submitting) return;
      event.preventDefault();
      Alert.alert(copy.discardTitle, copy.discardBody, [
        { text: copy.stay, style: "cancel" },
        {
          text: copy.leave,
          style: "destructive",
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });

    return listener;
  }, [copy.discardBody, copy.discardTitle, copy.leave, copy.stay, hasUnsavedChanges, navigation, submitting]);

  const visibilityLabel: Record<CommunityVisibility, string> = {
    public: copy.visibilityPublic,
    followers: copy.visibilityFollowers,
    private: copy.visibilityPrivate,
    friends: copy.visibilityFollowers,
  };

  const getTypeLabel = (type: CommunityPostType) => copy.typeLabels[type] ?? type;

  const goStep = (nextStep: CreateStep) => {
    triggerHaptic("selection").catch(() => undefined);
    setStep(nextStep);
  };

  const onTypeSelect = (type: CommunityPostType) => {
    triggerHaptic("selection").catch(() => undefined);
    setPostType(type);

    if (!TYPES_WITH_REQUIRED_SECOND.has(type)) {
      setSecondaryPerfumeId(undefined);
    }

    if (autoStepTimerRef.current) clearTimeout(autoStepTimerRef.current);
    autoStepTimerRef.current = setTimeout(() => {
      setStep(TYPES_WITH_REQUIRED_SECOND.has(type) ? 2 : 3);
    }, 150);
  };

  const onPickPerfume = (perfumeId: string) => {
    if (!requiresSecond) {
      setPrimaryPerfumeId(perfumeId);
      triggerHaptic("selection").catch(() => undefined);
      if (!requiresPrimary) {
        if (autoStepTimerRef.current) clearTimeout(autoStepTimerRef.current);
        autoStepTimerRef.current = setTimeout(() => setStep(3), 150);
      }
      return;
    }

    if (!primaryPerfumeId || primaryPerfumeId === perfumeId) {
      setPrimaryPerfumeId(perfumeId);
      if (secondaryPerfumeId === perfumeId) setSecondaryPerfumeId(undefined);
      triggerHaptic("selection").catch(() => undefined);
      return;
    }

    setSecondaryPerfumeId(perfumeId);
    triggerHaptic("selection").catch(() => undefined);
  };

  const continueFromStep2 = () => {
    if (requiresSecond && !primaryPerfumeId) {
      Alert.alert(copy.pickFirstPerfume);
      return;
    }
    if (requiresSecond && !secondaryPerfumeId) {
      Alert.alert(copy.pickSecondPerfume);
      return;
    }
    if (requiresPrimary && !primaryPerfumeId) {
      Alert.alert(copy.pickFirstPerfume);
      return;
    }
    goStep(3);
  };

  const showPermissionAlert = () => {
    Alert.alert(copy.permissionTitle, copy.permissionBody, [
      { text: copy.close, style: "cancel" },
      {
        text: copy.openSettings,
        onPress: () => {
          void Linking.openSettings();
        },
      },
    ]);
  };

  const handlePickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showPermissionAlert();
      return;
    }

    const image = await pickFromLibrary();
    if (!image) {
      Alert.alert(copy.mediaErrorTitle, copy.mediaErrorBody);
      return;
    }

    triggerHaptic("selection").catch(() => undefined);
    setSelectedMediaUri(image.uri);
  };

  const handleCaptureWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showPermissionAlert();
      return;
    }

    const image = await captureFromCamera();
    if (!image) {
      Alert.alert(copy.mediaErrorTitle, copy.mediaErrorBody);
      return;
    }

    triggerHaptic("impact").catch(() => undefined);
    setSelectedMediaUri(image.uri);
  };

  const handleGenerateAiTones = async () => {
    setAiLoading(true);
    setAiOptions([]);

    const seed = caption.trim() || (language === "tr" ? "Koku profili dengeli" : "Balanced scent profile");
    const perfumeLabel = primaryPerfume ? `${primaryPerfume.brand} ${primaryPerfume.name}` : (language === "tr" ? "bu parfüm" : "this perfume");

    await new Promise((resolve) => setTimeout(resolve, 700));

    if (language === "tr") {
      setAiOptions([
        `${perfumeLabel} bence premium segmentte çok güçlü duruyor. ${seed}`,
        `${perfumeLabel} bugün bende çok temiz ve keyifli açıldı. ${seed}`,
        `${perfumeLabel}: açılış canlı, dry-down dengeli, performans stabil. ${seed}`,
      ]);
    } else {
      setAiOptions([
        `${perfumeLabel} feels premium and polished. ${seed}`,
        `${perfumeLabel} opened super clean and enjoyable on my skin today. ${seed}`,
        `${perfumeLabel}: bright opening, balanced dry-down, stable performance. ${seed}`,
      ]);
    }

    setAiLoading(false);
  };

  const onPublish = async () => {
    if (!canPublish) {
      Alert.alert(copy.needCaption);
      return;
    }

    const extras: string[] = [];

    if (secondaryPerfume) {
      extras.push(language === "tr"
        ? `İkinci Parfüm: ${secondaryPerfume.brand} ${secondaryPerfume.name}`
        : `Second Perfume: ${secondaryPerfume.brand} ${secondaryPerfume.name}`);
    }

    if (postType === "worth_it") {
      extras.push(language === "tr" ? "[Alınır mı?]" : "[Worth It?]");
      if (pricePaid.trim()) extras.push(`${copy.buyPrice}: ${pricePaid.trim()}`);
      if (conditionValue.trim()) extras.push(`${copy.buyCondition}: ${conditionValue.trim()}`);
      if (batchCode.trim()) extras.push(`${copy.buyBatch}: ${batchCode.trim()}`);
      extras.push(`${copy.buyBox}: ${boxPapers === "yes" ? copy.boxYes : boxPapers === "no" ? copy.boxNo : copy.boxUnknown}`);
    }

    if (postType === "comparison" && comparisonQuestion.trim()) {
      extras.push(`${copy.comparisonTitle}: ${comparisonQuestion.trim()}`);
    }

    if (postType === "layering" && layeringOrder.trim()) {
      extras.push(`${copy.layeringTitle}: ${layeringOrder.trim()}`);
    }

    const payloadCaption = extras.length > 0
      ? `${caption.trim()}\n\n${extras.join("\n")}`
      : caption.trim();

    setSubmitting(true);
    setShowSubmittingOverlay(true);

    try {
      const created = await createCommunityPost({
        type: postType,
        caption: payloadCaption,
        perfumeId: primaryPerfumeId,
        mediaUri: selectedMediaUri ?? undefined,
        visibility,
        authorName: profile?.fullName ?? profile?.username ?? (language === "tr" ? "Sen" : "You"),
      });

      triggerHaptic("success").catch(() => undefined);
      await AsyncStorage.removeItem(draftKey);
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
        setShowSubmittingOverlay(false);
        router.replace(`/post/${created.id}` as never);
      }, 650);
    } catch {
      setShowSubmittingOverlay(false);
      Alert.alert(copy.submitErrorTitle, copy.submitErrorBody);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepType = () => (
    <Card variant="default" style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{copy.questionType}</Text>
      <View style={styles.typeGrid}>
        {POST_TYPES.map((type) => {
          const active = postType === type;
          return (
            <Pressable
              key={type}
              style={[styles.typeCard, active && styles.typeCardActive]}
              onPress={() => onTypeSelect(type)}
            >
              <Text style={[styles.typeCardText, active && styles.typeCardTextActive]}>{getTypeLabel(type)}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );

  const renderStepPerfume = () => (
    <Card variant="default" style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{requiresSecond ? copy.questionSecondPerfume : copy.questionPerfume}</Text>
      <TextInput
        value={perfumeSearch}
        onChangeText={setPerfumeSearch}
        placeholder={copy.searchPlaceholder}
        placeholderTextColor={colors.inkFaint}
        style={styles.searchInput}
      />

      <ScrollView style={styles.perfumeList} contentContainerStyle={styles.perfumeListContent}>
        {filteredPerfumes.map((perfume) => {
          const isPrimary = primaryPerfumeId === perfume.id;
          const isSecondary = secondaryPerfumeId === perfume.id;
          return (
            <Pressable
              key={perfume.id}
              style={[
                styles.perfumeRow,
                isPrimary && styles.perfumeRowPrimary,
                isSecondary && styles.perfumeRowSecondary,
              ]}
              onPress={() => onPickPerfume(perfume.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.perfumeRowName}>{perfume.name}</Text>
                <Text style={styles.perfumeRowBrand}>{perfume.brand}</Text>
              </View>
              {isPrimary ? <Text style={styles.rowBadge}>1</Text> : null}
              {isSecondary ? <Text style={styles.rowBadge}>2</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.stepActionsRow}>
        {!requiresPrimary ? (
          <Button size="sm" title={copy.continueWithoutPerfume} variant="ghost" onPress={() => goStep(3)} />
        ) : null}
        <Button
          size="sm"
          title={
            requiresSecond
              ? (primaryPerfumeId ? (secondaryPerfumeId ? copy.continue : copy.pickSecondPerfume) : copy.pickFirstPerfume)
              : (primaryPerfumeId || !requiresPrimary ? copy.continue : copy.pickFirstPerfume)
          }
          variant="primary"
          disabled={!canContinueFromStep2}
          onPress={continueFromStep2}
        />
      </View>
    </Card>
  );

  const renderStepCompose = () => (
    <>
      <Card variant="default" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.linkedPerfumeTitle}</Text>
        {primaryPerfume ? (
          <View style={styles.linkedPerfumeCard}>
            <Text style={styles.linkedPerfumeName}>{primaryPerfume.brand} · {primaryPerfume.name}</Text>
            {secondaryPerfume ? (
              <Text style={styles.linkedPerfumeMeta}>{secondaryPerfume.brand} · {secondaryPerfume.name}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.mediaHint}>{copy.linkedPerfumeEmpty}</Text>
        )}
        <Text style={styles.linkedPerfumeHint}>
          {requiresPrimary ? copy.linkedPerfumeRequired : copy.linkedPerfumeOptional}
        </Text>
        <View style={styles.stepActionsRow}>
          <Button
            size="sm"
            title={primaryPerfume ? copy.linkedPerfumeChange : copy.linkedPerfumeSelect}
            variant="secondary"
            onPress={() => goStep(2)}
          />
        </View>
      </Card>

      <Card variant="default" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.questionCaption}</Text>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={5}
          placeholder={copy.questionCaption}
          placeholderTextColor={colors.inkFaint}
          textAlignVertical="top"
          style={styles.captionInput}
        />

        <View style={styles.captionMetaRow}>
          <Text style={styles.draftMeta}>{caption.trim().length > 0 ? copy.draftSaved : " "}</Text>
          <Text style={[styles.captionCounter, captionLength < 10 && styles.captionCounterWarning]}>
            {captionLength} {copy.chars} · {copy.minChar}
          </Text>
        </View>

        <View style={styles.helperRow}>
          <Pressable style={styles.helperPill} onPress={() => setShowAiSheet(true)}>
            <Text style={styles.helperPillText}>{copy.aiWrite}</Text>
          </Pressable>
          {primaryPerfume ? (
            <Pressable
              style={styles.helperPill}
              onPress={() => {
                const mention = `@${primaryPerfume.brand.replace(/\s+/g, "")}`;
                setCaption((prev) => `${prev.trim()} ${mention}`.trim());
              }}
            >
              <Text style={styles.helperPillText}>{copy.mention}</Text>
            </Pressable>
          ) : null}
        </View>
      </Card>

      {(postType === "worth_it") ? (
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{copy.buyInfoTitle}</Text>
          <TextInput
            value={pricePaid}
            onChangeText={setPricePaid}
            placeholder={copy.buyPrice}
            placeholderTextColor={colors.inkFaint}
            style={styles.formInput}
          />
          <TextInput
            value={conditionValue}
            onChangeText={setConditionValue}
            placeholder={copy.buyCondition}
            placeholderTextColor={colors.inkFaint}
            style={styles.formInput}
          />
          <TextInput
            value={batchCode}
            onChangeText={setBatchCode}
            placeholder={copy.buyBatch}
            placeholderTextColor={colors.inkFaint}
            style={styles.formInput}
          />
          <Text style={styles.sectionSubTitle}>{copy.buyBox}</Text>
          <View style={styles.rowWrap}>
            {(["yes", "no", "unknown"] as BoxPapersValue[]).map((item) => {
              const active = boxPapers === item;
              const label = item === "yes" ? copy.boxYes : item === "no" ? copy.boxNo : copy.boxUnknown;
              return (
                <Pressable
                  key={item}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setBoxPapers(item)}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : null}

      {postType === "comparison" ? (
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{copy.comparisonTitle}</Text>
          <TextInput
            value={comparisonQuestion}
            onChangeText={setComparisonQuestion}
            placeholder={copy.comparisonTitle}
            placeholderTextColor={colors.inkFaint}
            style={styles.formInput}
          />
        </Card>
      ) : null}

      {postType === "layering" ? (
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{copy.layeringTitle}</Text>
          <TextInput
            value={layeringOrder}
            onChangeText={setLayeringOrder}
            placeholder={copy.layeringTitle}
            placeholderTextColor={colors.inkFaint}
            style={styles.formInput}
          />
        </Card>
      ) : null}

      <Card variant="default" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Medya</Text>
        <Text style={styles.mediaHint}>{copy.mediaHint}</Text>

        {selectedMediaUri ? (
          <View style={styles.mediaPreviewWrap}>
            <Image source={{ uri: selectedMediaUri }} style={styles.mediaPreview} />
          </View>
        ) : null}

        <View style={styles.mediaActions}>
          <Button size="sm" title={copy.openCamera} variant="secondary" onPress={() => void handleCaptureWithCamera()} />
          <Button size="sm" title={copy.openLibrary} variant="secondary" onPress={() => void handlePickFromLibrary()} />
          <Button size="sm" title={copy.openFiles} variant="secondary" onPress={() => void handlePickFromLibrary()} />
          {selectedMediaUri ? (
            <Button size="sm" title={copy.removeMedia} variant="ghost" onPress={() => setSelectedMediaUri(null)} />
          ) : null}
        </View>
      </Card>

      <Card variant="default" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.questionVisibility}</Text>
        <View style={styles.rowWrap}>
          {VISIBILITIES.map((value) => {
            const active = visibility === value;
            return (
              <Pressable key={value} style={[styles.pill, active && styles.pillActive]} onPress={() => setVisibility(value)}>
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{visibilityLabel[value]}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card variant="tinted" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.preview}</Text>
        <Text style={styles.previewMeta}>
          {(profile?.fullName ?? profile?.username ?? (language === "tr" ? "Sen" : "You"))} · {getTypeLabel(postType)}
        </Text>
        {primaryPerfume ? <Text style={styles.previewPerfume}>{primaryPerfume.brand} · {primaryPerfume.name}</Text> : null}
        {secondaryPerfume ? <Text style={styles.previewPerfume}>{secondaryPerfume.brand} · {secondaryPerfume.name}</Text> : null}
        <Text style={styles.previewBody}>{caption.trim() || "..."}</Text>
      </Card>
    </>
  );

  return (
    <Screen scroll noPadding>
      <StackHeader title={copy.title} subtitle={copy.subtitle} onBack={() => router.back()} />

      <View style={styles.stepperRow}>
        <Pressable style={[styles.stepPill, step === 1 && styles.stepPillActive]} onPress={() => goStep(1)}>
          <Text style={[styles.stepPillText, step === 1 && styles.stepPillTextActive]}>{copy.step1}</Text>
        </Pressable>
        <Pressable style={[styles.stepPill, step === 2 && styles.stepPillActive]} onPress={() => goStep(2)}>
          <Text style={[styles.stepPillText, step === 2 && styles.stepPillTextActive]}>{copy.step2}</Text>
        </Pressable>
        <Pressable style={[styles.stepPill, step === 3 && styles.stepPillActive]} onPress={() => goStep(3)}>
          <Text style={[styles.stepPillText, step === 3 && styles.stepPillTextActive]}>{copy.step3}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {step === 1 ? renderStepType() : null}
        {step === 2 ? renderStepPerfume() : null}
        {step === 3 ? renderStepCompose() : null}
      </ScrollView>

      {step === 3 ? (
        <View style={styles.bottomBar}>
          <Button title={copy.publish} variant="primary" loading={submitting} disabled={!canPublish} onPress={() => void onPublish()} />
          <Button title={copy.cancel} variant="ghost" onPress={() => router.back()} />
        </View>
      ) : null}

      <Modal transparent animationType="fade" visible={showAiSheet} onRequestClose={() => setShowAiSheet(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>{copy.aiWrite}</Text>

            {aiLoading ? (
              <View style={styles.aiLoadingWrap}>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.mediaHint}>{copy.aiLoading}</Text>
              </View>
            ) : (
              <>
                {aiOptions.map((option, index) => (
                  <View key={`${option}-${index}`} style={styles.aiOptionCard}>
                    <Text style={styles.aiOptionText}>{option}</Text>
                    <Pressable
                      style={styles.aiUseButton}
                      onPress={() => {
                        setCaption(option);
                        setShowAiSheet(false);
                      }}
                    >
                      <Text style={styles.aiUseButtonText}>{copy.aiUse}</Text>
                    </Pressable>
                  </View>
                ))}
              </>
            )}

            <View style={styles.modalActionsRow}>
              <Button size="sm" title={copy.aiGenerate} variant="secondary" onPress={() => void handleGenerateAiTones()} loading={aiLoading} />
              <Button size="sm" title={copy.close} variant="ghost" onPress={() => setShowAiSheet(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {showSubmittingOverlay ? (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.overlayTitle}>{copy.loadingTitle}</Text>
            <Text style={styles.overlayBody}>{copy.loadingBody}</Text>
          </View>
        </View>
      ) : null}

      {showSuccessToast ? (
        <View style={styles.toastWrap}>
          <Text style={styles.toastText}>{copy.successBody}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    stepperRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.sm,
    },
    stepPill: {
      flex: 1,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingVertical: 8,
      alignItems: "center",
    },
    stepPillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    stepPillText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      color: colors.inkMid,
    },
    stepPillTextActive: {
      color: "#FFF8F1",
    },
    scrollContent: {
      paddingHorizontal: SPACING.xl,
      paddingBottom: 220,
      gap: SPACING.md,
    },
    sectionCard: {
      gap: SPACING.sm,
    },
    sectionTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: colors.ink,
    },
    sectionSubTitle: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.inkMid,
    },
    typeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    typeCard: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    typeCardActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentLight,
    },
    typeCardText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 12,
      color: colors.inkMid,
    },
    typeCardTextActive: {
      color: colors.accent,
    },
    searchInput: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.ink,
    },
    perfumeList: {
      maxHeight: 260,
    },
    perfumeListContent: {
      gap: 8,
      paddingBottom: 2,
    },
    perfumeRow: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    perfumeRowPrimary: {
      borderColor: colors.accent,
      backgroundColor: colors.accentLight,
    },
    perfumeRowSecondary: {
      borderColor: colors.warning,
    },
    perfumeRowName: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.ink,
    },
    perfumeRowBrand: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
    },
    rowBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      textAlign: "center",
      textAlignVertical: "center",
      fontFamily: FONTS.sansBold,
      fontSize: 12,
      color: "#FFF8F1",
      backgroundColor: colors.accent,
      overflow: "hidden",
      paddingTop: 3,
    },
    stepActionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      paddingTop: 4,
    },
    captionInput: {
      minHeight: 120,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.ink,
      lineHeight: 20,
    },
    formInput: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.ink,
    },
    rowWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    pill: {
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    pillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    pillText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.inkMid,
    },
    pillTextActive: {
      color: "#FFF8F1",
    },
    draftMeta: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkFaint,
    },
    captionMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: SPACING.sm,
    },
    captionCounter: {
      fontFamily: FONTS.sans,
      fontSize: 11,
      color: colors.inkFaint,
    },
    captionCounterWarning: {
      color: colors.warning,
    },
    helperRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    helperPill: {
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.md,
      paddingVertical: 7,
    },
    helperPillText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
    },
    mediaHint: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
      lineHeight: 17,
    },
    linkedPerfumeCard: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      gap: 3,
    },
    linkedPerfumeName: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.ink,
    },
    linkedPerfumeMeta: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
    },
    linkedPerfumeHint: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkFaint,
      lineHeight: 17,
    },
    mediaPreviewWrap: {
      borderRadius: RADIUS.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    mediaPreview: {
      width: "100%",
      aspectRatio: 4 / 3,
      resizeMode: "cover",
    },
    mediaActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    previewMeta: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    previewBody: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 20,
      color: colors.ink,
    },
    previewPerfume: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 12,
      color: colors.inkMid,
    },
    bottomBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.xl,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.bg,
      gap: SPACING.sm,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      paddingHorizontal: SPACING.xl,
    },
    modalCard: {
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: SPACING.lg,
      gap: SPACING.sm,
      maxHeight: "75%",
    },
    aiLoadingWrap: {
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: SPACING.md,
    },
    aiOptionCard: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    aiOptionText: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      lineHeight: 18,
      color: colors.ink,
    },
    aiUseButton: {
      alignSelf: "flex-start",
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentLight,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
    },
    aiUseButtonText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
    },
    modalActionsRow: {
      flexDirection: "row",
      gap: 8,
      justifyContent: "flex-end",
      paddingTop: 4,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.xl,
    },
    overlayCard: {
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.lg,
      gap: 6,
      alignItems: "center",
    },
    overlayTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: colors.ink,
    },
    overlayBody: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
      textAlign: "center",
      lineHeight: 17,
    },
    toastWrap: {
      position: "absolute",
      left: SPACING.xl,
      right: SPACING.xl,
      bottom: 96,
      borderRadius: RADIUS.full,
      backgroundColor: colors.success,
      paddingVertical: 10,
      alignItems: "center",
    },
    toastText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: "#FFF8F1",
    },
  });
