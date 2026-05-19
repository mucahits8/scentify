import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export interface PreparedImage {
  base64: string;
  mimeType: string;
  uri: string;
}

async function compressAndEncode(uri: string): Promise<PreparedImage> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (!result.base64) throw new Error("Image encoding failed");
  return { base64: result.base64, mimeType: "image/jpeg", uri: result.uri };
}

export async function pickFromLibrary(): Promise<PreparedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
    allowsEditing: false,
  });

  if (picked.canceled || !picked.assets[0]) return null;
  return compressAndEncode(picked.assets[0].uri);
}

export async function captureFromCamera(): Promise<PreparedImage | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const captured = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 1,
    allowsEditing: false,
  });

  if (captured.canceled || !captured.assets[0]) return null;
  return compressAndEncode(captured.assets[0].uri);
}
