import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createDocument,
  DocumentStatus,
  DocumentType,
  updateDocumentAttachment,
} from "../services/documents";
import {
  deleteDocumentAttachmentFile,
  saveDocumentAttachment,
} from "../services/document-attachment-storage";
import {
  LocalProject,
  getAllLocalProjects,
} from "../services/projects";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

const TYPE_OPTIONS: DocumentType[] = [
  "Resolution",
  "Purchase Request",
  "Voucher",
  "Liquidation Record",
  "Other SK Document",
];

const STATUS_OPTIONS: DocumentStatus[] = [
  "Draft",
  "Final",
  "Archived",
];

function formatDateForStorage(
  value: Date
) {
  const year = value.getFullYear();
  const month = String(
    value.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    value.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(
  value: Date
) {
  return value.toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

export default function AddDocumentScreen() {
  const [projects, setProjects] =
    useState<LocalProject[]>([]);

  const [documentType, setDocumentType] =
    useState<DocumentType>(
      "Other SK Document"
    );

  const [
    documentNumber,
    setDocumentNumber,
  ] = useState("");

  const [
    documentDate,
    setDocumentDate,
  ] = useState(new Date());

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [status, setStatus] =
    useState<DocumentStatus>(
      "Draft"
    );

  const [
    relatedProjectId,
    setRelatedProjectId,
  ] = useState("");

  const [typeOpen, setTypeOpen] =
    useState(false);

  const [statusOpen, setStatusOpen] =
    useState(false);

  const [
    projectOpen,
    setProjectOpen,
  ] = useState(false);

  const [
    showDatePicker,
    setShowDatePicker,
  ] = useState(false);

  const [
    pendingAttachment,
    setPendingAttachment,
  ] = useState<{
    uri: string;
    name: string;
    mimeType: string | null;
  } | null>(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const [titleError, setTitleError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProjects() {
        try {
          const rows =
            await getAllLocalProjects();

          if (active) {
            setProjects(rows);
          }
        } catch (error) {
          console.error(
            "Document project loading error:",
            error
          );
        }
      }

      loadProjects();

      return () => {
        active = false;
      };
    }, [])
  );

  function handleDateValueChange(
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    if (!selectedDate) {
      return;
    }

    setDocumentDate(selectedDate);
    setShowDatePicker(false);
  }

  function handleDateDismiss() {
    setShowDatePicker(false);
  }

  async function handlePickAttachment() {
    try {
      setFormError("");

      const result =
        await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (
        result.canceled ||
        !result.assets?.[0]
      ) {
        return;
      }

      const asset =
        result.assets[0];

      setPendingAttachment({
        uri: asset.uri,
        name:
          asset.name ||
          "attachment",
        mimeType:
          asset.mimeType || null,
      });
    } catch (error) {
      console.error(
        "Attachment picker error:",
        error
      );

      setFormError(
        "Unable to select the attachment."
      );
    }
  }

  async function handleSave() {
    const cleanTitle =
      title.trim();

    if (!cleanTitle) {
      setTitleError(
        "Please enter a document title."
      );
      return;
    }

    try {
      setIsSaving(true);
      setTitleError("");
      setFormError("");

      const user =
        await getCurrentSessionUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const id =
        await createDocument({
          documentType,
          documentNumber,
          documentDate:
            formatDateForStorage(
              documentDate
            ),
          title: cleanTitle,
          description,
          status,
          relatedProjectId,
          createdBy: user.id,
        });

      if (pendingAttachment) {
        let savedUri:
          | string
          | null = null;

        try {
          savedUri =
            await saveDocumentAttachment({
              sourceUri:
                pendingAttachment.uri,
              documentId: id,
              fileName:
                pendingAttachment.name,
            });

          await updateDocumentAttachment({
            documentId: id,
            attachmentUri:
              savedUri,
            attachmentName:
              pendingAttachment.name,
            attachmentMimeType:
              pendingAttachment.mimeType,
          });
        } catch (attachmentError) {
          if (savedUri) {
            await deleteDocumentAttachmentFile(
              savedUri
            );
          }

          throw attachmentError;
        }
      }

      router.replace({
        pathname:
          "/document-details",
        params: {
          id,
        },
      });
    } catch (error) {
      console.error(
        "Create document error:",
        error
      );

      setFormError(
        "Unable to create the document. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const selectedProject =
    projects.find(
      (project) =>
        project.id ===
        relatedProjectId
    ) || null;

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
            disabled={isSaving}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text}
            />
          </Pressable>

          <Text
            style={styles.headerTitle}
          >
            Add Document
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <Text
            style={styles.introTitle}
          >
            Document Information
          </Text>

          <Text
            style={styles.introText}
          >
            Record an official SK document
            and optionally link it to a
            project.
          </Text>

          <Text style={styles.label}>
            Document Type
          </Text>

          <Pressable
            style={styles.selector}
            onPress={() => {
              setTypeOpen(
                (current) => !current
              );
              setStatusOpen(false);
              setProjectOpen(false);
            }}
          >
            <Text
              style={styles.selectorText}
              numberOfLines={1}
            >
              {documentType}
            </Text>

            <Ionicons
              name={
                typeOpen
                  ? "chevron-up-outline"
                  : "chevron-down-outline"
              }
              size={19}
              color={colors.textMuted}
            />
          </Pressable>

          {typeOpen ? (
            <View
              style={styles.optionsList}
            >
              {TYPE_OPTIONS.map(
                (option) => {
                  const selected =
                    option ===
                    documentType;

                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.optionRow,
                        selected &&
                          styles.optionRowSelected,
                      ]}
                      onPress={() => {
                        setDocumentType(
                          option
                        );
                        setTypeOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected &&
                            styles.optionTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {option}
                      </Text>

                      <View
                        style={
                          styles.checkSlot
                        }
                      >
                        {selected ? (
                          <Ionicons
                            name="checkmark"
                            size={19}
                            color={
                              colors.primary
                            }
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }
              )}
            </View>
          ) : null}

          <Text style={styles.label}>
            Document Number
          </Text>

          <TextInput
            style={styles.input}
            value={documentNumber}
            onChangeText={
              setDocumentNumber
            }
            placeholder="Optional"
            placeholderTextColor={
              colors.textMuted
            }
          />

          <Text style={styles.label}>
            Date
          </Text>

          <Pressable
            style={styles.selector}
            onPress={() =>
              setShowDatePicker(true)
            }
          >
            <View
              style={styles.selectorLeft}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />

              <Text
                style={styles.selectorText}
              >
                {formatDateForDisplay(
                  documentDate
                )}
              </Text>
            </View>

            <Ionicons
              name="chevron-down-outline"
              size={19}
              color={colors.textMuted}
            />
          </Pressable>

          <Text style={styles.label}>
            Title
          </Text>

          <TextInput
            style={[
              styles.input,
              titleError &&
                styles.inputError,
            ]}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setTitleError("");
              setFormError("");
            }}
            placeholder="Document title"
            placeholderTextColor={
              colors.textMuted
            }
            autoCapitalize="sentences"
          />

          {titleError ? (
            <Text
              style={styles.errorText}
            >
              {titleError}
            </Text>
          ) : null}

          <Text style={styles.label}>
            Description
          </Text>

          <TextInput
            style={styles.multilineInput}
            value={description}
            onChangeText={
              setDescription
            }
            placeholder="Optional description"
            placeholderTextColor={
              colors.textMuted
            }
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>
            Status
          </Text>

          <Pressable
            style={styles.selector}
            onPress={() => {
              setStatusOpen(
                (current) => !current
              );
              setTypeOpen(false);
              setProjectOpen(false);
            }}
          >
            <Text
              style={styles.selectorText}
              numberOfLines={1}
            >
              {status}
            </Text>

            <Ionicons
              name={
                statusOpen
                  ? "chevron-up-outline"
                  : "chevron-down-outline"
              }
              size={19}
              color={colors.textMuted}
            />
          </Pressable>

          {statusOpen ? (
            <View
              style={styles.optionsList}
            >
              {STATUS_OPTIONS.map(
                (option) => {
                  const selected =
                    option === status;

                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.optionRow,
                        selected &&
                          styles.optionRowSelected,
                      ]}
                      onPress={() => {
                        setStatus(option);
                        setStatusOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>

                      <View
                        style={
                          styles.checkSlot
                        }
                      >
                        {selected ? (
                          <Ionicons
                            name="checkmark"
                            size={19}
                            color={
                              colors.primary
                            }
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }
              )}
            </View>
          ) : null}

          <Text style={styles.label}>
            Related Project
          </Text>

          <Pressable
            style={styles.selector}
            onPress={() => {
              setProjectOpen(
                (current) => !current
              );
              setTypeOpen(false);
              setStatusOpen(false);
            }}
          >
            <Text
              style={[
                styles.selectorText,
                !selectedProject &&
                  styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {selectedProject
                ? selectedProject.title
                : "None"}
            </Text>

            <Ionicons
              name={
                projectOpen
                  ? "chevron-up-outline"
                  : "chevron-down-outline"
              }
              size={19}
              color={colors.textMuted}
            />
          </Pressable>

          {projectOpen ? (
            <View
              style={styles.optionsList}
            >
              <Pressable
                style={[
                  styles.optionRow,
                  !relatedProjectId &&
                    styles.optionRowSelected,
                ]}
                onPress={() => {
                  setRelatedProjectId("");
                  setProjectOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    !relatedProjectId &&
                      styles.optionTextSelected,
                  ]}
                >
                  None
                </Text>

                <View
                  style={styles.checkSlot}
                >
                  {!relatedProjectId ? (
                    <Ionicons
                      name="checkmark"
                      size={19}
                      color={
                        colors.primary
                      }
                    />
                  ) : null}
                </View>
              </Pressable>

              {projects.map(
                (project) => {
                  const selected =
                    project.id ===
                    relatedProjectId;

                  return (
                    <Pressable
                      key={project.id}
                      style={[
                        styles.optionRow,
                        selected &&
                          styles.optionRowSelected,
                      ]}
                      onPress={() => {
                        setRelatedProjectId(
                          project.id
                        );
                        setProjectOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected &&
                            styles.optionTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {project.title}
                      </Text>

                      <View
                        style={
                          styles.checkSlot
                        }
                      >
                        {selected ? (
                          <Ionicons
                            name="checkmark"
                            size={19}
                            color={
                              colors.primary
                            }
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }
              )}
            </View>
          ) : null}

          <Text style={styles.label}>
            Attachment
          </Text>

          <Pressable
            style={styles.attachmentPicker}
            onPress={
              handlePickAttachment
            }
            disabled={isSaving}
          >
            <Ionicons
              name="attach-outline"
              size={21}
              color={colors.primary}
            />

            <View
              style={styles.attachmentPickerText}
            >
              <Text
                style={styles.attachmentTitle}
                numberOfLines={1}
              >
                {pendingAttachment
                  ? pendingAttachment.name
                  : "Choose a file"}
              </Text>

              <Text
                style={styles.attachmentHint}
                numberOfLines={3}
              >
                {pendingAttachment
                  ? "This file will be copied into the app's private local storage."
                  : "Optional • PDF, Office files,\ntext, CSV, or images"}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward-outline"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>

          {pendingAttachment ? (
            <Pressable
              style={styles.removeAttachmentButton}
              onPress={() =>
                setPendingAttachment(
                  null
                )
              }
              disabled={isSaving}
            >
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={colors.danger}
              />

              <Text
                style={
                  styles.removeAttachmentText
                }
              >
                Remove selected file
              </Text>
            </Pressable>
          ) : null}

          {formError ? (
            <Text
              style={styles.formError}
            >
              {formError}
            </Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              (pressed ||
                isSaving) &&
                styles.buttonPressed,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text
              style={
                styles.saveButtonText
              }
            >
              {isSaving
                ? "Saving..."
                : "Save Document"}
            </Text>
          </Pressable>
        </ScrollView>

        {showDatePicker ? (
          <DateTimePicker
            value={documentDate}
            mode="date"
            display={
              Platform.OS === "android"
                ? "default"
                : "spinner"
            }
            onValueChange={
              handleDateValueChange
            }
            onDismiss={
              handleDateDismiss
            }
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal:
      spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom:
      spacing.xxxl,
  },
  introTitle: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  introText: {
    marginTop: spacing.sm,
    marginBottom:
      spacing.lg,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
  },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  input: {
    minHeight: 52,
    paddingHorizontal:
      spacing.md,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    fontSize:
      typography.fontSize.sm,
    color: colors.text,
    backgroundColor:
      colors.white,
  },
  multilineInput: {
    minHeight: 100,
    padding: spacing.md,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color: colors.text,
    backgroundColor:
      colors.white,
  },
  selector: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    paddingHorizontal:
      spacing.md,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    backgroundColor:
      colors.white,
  },
  selectorLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  selectorText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  optionsList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor:
      colors.white,
  },
  optionRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal:
      spacing.md,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  optionRowSelected: {
    backgroundColor:
      "#EFF6FF",
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    paddingRight:
      spacing.md,
    fontSize:
      typography.fontSize.sm,
    color: colors.text,
  },
  optionTextSelected: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },
  checkSlot: {
    width: 24,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  inputError: {
    borderColor:
      colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize:
      typography.fontSize.xs,
    color: colors.danger,
  },
  attachmentPicker: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  attachmentPickerText: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: spacing.sm,
  },
  attachmentTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  attachmentHint: {
    width: "100%",
    flexShrink: 1,
    marginTop: 3,
    paddingRight: 2,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textMuted,
  },
  removeAttachmentButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  removeAttachmentText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.danger,
  },
  formError: {
    marginTop: spacing.md,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color: colors.danger,
    textAlign: "center",
  },
  saveButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    borderRadius: 14,
    backgroundColor:
      colors.primary,
  },
  saveButtonText: {
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
