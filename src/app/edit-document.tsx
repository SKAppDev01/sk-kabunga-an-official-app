import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
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

import { AppHeader } from "../components/AppHeader";

import {
  clearDocumentAttachment,
  DocumentStatus,
  DocumentType,
  getDocumentById,
  updateDocument,
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

function parseStorageDate(
  value: string
) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return new Date();
  }

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
}

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

export default function EditDocumentScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const documentId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

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

  const [
    existingAttachmentUri,
    setExistingAttachmentUri,
  ] = useState<string | null>(
    null
  );

  const [
    existingAttachmentName,
    setExistingAttachmentName,
  ] = useState<string | null>(
    null
  );

  const [
    existingAttachmentMimeType,
    setExistingAttachmentMimeType,
  ] = useState<string | null>(
    null
  );

  const [
    pendingAttachment,
    setPendingAttachment,
  ] = useState<{
    uri: string;
    name: string;
    mimeType: string | null;
  } | null>(null);

  const [
    removeExistingAttachment,
    setRemoveExistingAttachment,
  ] = useState(false);

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

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [titleError, setTitleError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadData() {
        if (!documentId) {
          if (active) {
            setFormError(
              "Document not found."
            );
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);
          setFormError("");

          const [
            document,
            projectRows,
          ] = await Promise.all([
            getDocumentById(
              documentId
            ),
            getAllLocalProjects(),
          ]);

          if (!active) {
            return;
          }

          if (!document) {
            setFormError(
              "Document not found."
            );
            return;
          }

          setProjects(
            projectRows
          );
          setDocumentType(
            document.documentType
          );
          setDocumentNumber(
            document.documentNumber ||
            ""
          );
          setDocumentDate(
            parseStorageDate(
              document.documentDate
            )
          );
          setTitle(
            document.title
          );
          setDescription(
            document.description ||
            ""
          );
          setStatus(
            document.status
          );
          setRelatedProjectId(
            document.relatedProjectId ||
            ""
          );
          setExistingAttachmentUri(
            document.attachmentUri
          );
          setExistingAttachmentName(
            document.attachmentName
          );
          setExistingAttachmentMimeType(
            document.attachmentMimeType
          );
          setPendingAttachment(
            null
          );
          setRemoveExistingAttachment(
            false
          );
        } catch (error) {
          console.error(
            "Edit document loading error:",
            error
          );

          if (active) {
            setFormError(
              "Unable to load the document."
            );
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadData();

      return () => {
        active = false;
      };
    }, [documentId])
  );

  function handleDateValueChange(
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    setShowDatePicker(false);

    if (
      event.type === "dismissed" ||
      !selectedDate
    ) {
      return;
    }

    setDocumentDate(
      selectedDate
    );
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

      setRemoveExistingAttachment(
        false
      );
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
    if (!documentId) {
      return;
    }

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

      await updateDocument({
        documentId,
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
      });

      if (pendingAttachment) {
        let newUri:
          | string
          | null = null;

        try {
          newUri =
            await saveDocumentAttachment({
              sourceUri:
                pendingAttachment.uri,
              documentId,
              fileName:
                pendingAttachment.name,
            });

          await updateDocumentAttachment({
            documentId,
            attachmentUri:
              newUri,
            attachmentName:
              pendingAttachment.name,
            attachmentMimeType:
              pendingAttachment.mimeType,
          });

          if (
            existingAttachmentUri &&
            existingAttachmentUri !==
              newUri
          ) {
            await deleteDocumentAttachmentFile(
              existingAttachmentUri
            );
          }
        } catch (attachmentError) {
          if (newUri) {
            await deleteDocumentAttachmentFile(
              newUri
            );
          }

          throw attachmentError;
        }
      } else if (
        removeExistingAttachment &&
        existingAttachmentUri
      ) {
        await clearDocumentAttachment(
          documentId
        );

        await deleteDocumentAttachmentFile(
          existingAttachmentUri
        );
      }

      router.back();
    } catch (error) {
      console.error(
        "Update document error:",
        error
      );

      setFormError(
        "Unable to save the document changes."
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

  const visibleAttachmentName =
    pendingAttachment?.name ||
    (
      removeExistingAttachment
        ? null
        : existingAttachmentName
    );

  const visibleAttachmentMimeType =
    pendingAttachment?.mimeType ||
    (
      removeExistingAttachment
        ? null
        : existingAttachmentMimeType
    );

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Edit Document"
        showBack
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        

        {isLoading ? (
          <View
            style={styles.centerState}
          >
            <Text
              style={styles.stateText}
            >
              Loading document...
            </Text>
          </View>
        ) : (
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
                          style={styles.checkSlot}
                        >
                          {selected ? (
                            <Ionicons
                              name="checkmark"
                              size={19}
                              color={colors.primary}
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
                          style={styles.checkSlot}
                        >
                          {selected ? (
                            <Ionicons
                              name="checkmark"
                              size={19}
                              color={colors.primary}
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
                        color={colors.primary}
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
                          style={styles.checkSlot}
                        >
                          {selected ? (
                            <Ionicons
                              name="checkmark"
                              size={19}
                              color={colors.primary}
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
                  {visibleAttachmentName ||
                    "Choose a file"}
                </Text>

                <Text
                  style={styles.attachmentHint}
                  numberOfLines={3}
                >
                  {visibleAttachmentName
                    ? visibleAttachmentMimeType ||
                      "Stored in private app storage"
                    : "Optional • PDF, Office files,\ntext, CSV, or images"}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>

            {visibleAttachmentName ? (
              <Pressable
                style={styles.removeAttachmentButton}
                onPress={() => {
                  setPendingAttachment(
                    null
                  );

                  if (
                    existingAttachmentUri
                  ) {
                    setRemoveExistingAttachment(
                      true
                    );
                  }
                }}
                disabled={isSaving}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                />

                <Text
                  style={styles.removeAttachmentText}
                >
                  Remove attachment
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
                style={styles.saveButtonText}
              >
                {isSaving
                  ? "Saving..."
                  : "Save Changes"}
              </Text>
            </Pressable>
          </ScrollView>
        )}

        {showDatePicker ? (
          <DateTimePicker
            value={documentDate}
            mode="date"
            display="default"
            onChange={handleDateValueChange}
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },
  flex: {
    flex: 1,
  },
  header: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: -spacing.xl,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 4,
    zIndex: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  input: {
    elevation: 2,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    backgroundColor: colors.white,
  },
  multilineInput: {
    elevation: 2,
    minHeight: 100,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.text,
    backgroundColor: colors.white,
  },
  selector: {
    elevation: 2,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
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
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  optionsList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  optionRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionRowSelected: {
    backgroundColor: "#EFF6FF",
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
    fontSize: typography.fontSize.sm,
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
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.danger,
  },
  attachmentPicker: {
    elevation: 2,
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
    fontSize: typography.fontSize.sm,
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
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
