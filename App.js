import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { getLocales } from 'expo-localization';

const STORAGE_KEY = '@student_manager_students';

const translations = {
  vi: {
    appName: 'Quản lý Sinh viên',
    studentList: 'Danh sách sinh viên',
    noStudents: 'Chưa có sinh viên nào',
    addStudent: 'Thêm sinh viên',
    studentDetail: 'Thông tin sinh viên',
    addTitle: 'Thêm sinh viên mới',
    editTitle: 'Sửa thông tin sinh viên',

    fullName: 'Họ tên sinh viên',
    studentCode: 'Mã số sinh viên',
    email: 'Email',
    avatar: 'Ảnh đại diện',

    fullNamePlaceholder: 'Nhập họ tên sinh viên',
    studentCodePlaceholder: 'Nhập mã số sinh viên',
    emailPlaceholder: 'Nhập email',
    avatarPlaceholder: 'Nhập link ảnh hoặc chọn ảnh từ thiết bị',

    chooseImage: 'Chọn ảnh từ thiết bị',
    save: 'Lưu',
    edit: 'Sửa',
    delete: 'Xóa',
    back: 'Quay lại',
    cancel: 'Hủy',

    required: 'Vui lòng nhập đầy đủ thông tin.',
    invalidEmail: 'Email không đúng định dạng.',
    duplicateCode: 'Mã số sinh viên đã tồn tại.',

    confirmEditTitle: 'Xác nhận sửa',
    confirmEdit:
      'Bạn có muốn sửa thông tin sinh viên không?',

    confirmDeleteTitle: 'Xác nhận xóa',
    confirmDelete:
      'Bạn có muốn xóa thông tin sinh viên không?',

    yes: 'Có',
    no: 'Không',

    imagePermission:
      'Ứng dụng cần quyền truy cập thư viện ảnh.',
  },

  en: {
    appName: 'Student Manager',
    studentList: 'Student List',
    noStudents: 'No students yet',
    addStudent: 'Add Student',
    studentDetail: 'Student Details',
    addTitle: 'Add New Student',
    editTitle: 'Edit Student',

    fullName: 'Full Name',
    studentCode: 'Student ID',
    email: 'Email',
    avatar: 'Avatar',

    fullNamePlaceholder: 'Enter student name',
    studentCodePlaceholder: 'Enter student ID',
    emailPlaceholder: 'Enter email',
    avatarPlaceholder: 'Enter image URL or choose from device',

    chooseImage: 'Choose Image',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    cancel: 'Cancel',

    required: 'Please enter all required information.',
    invalidEmail: 'Invalid email format.',
    duplicateCode: 'Student ID already exists.',

    confirmEditTitle: 'Confirm Edit',
    confirmEdit:
      'Do you want to edit this student?',

    confirmDeleteTitle: 'Confirm Delete',
    confirmDelete:
      'Do you want to delete this student?',

    yes: 'Yes',
    no: 'No',

    imagePermission:
      'The app needs permission to access your photo library.',
  },
};

const emptyForm = {
  fullName: '',
  studentCode: '',
  email: '',
  avatar: '',
};

export default function App() {
  const deviceLanguage =
    getLocales()[0]?.languageCode === 'vi' ? 'vi' : 'en';

  const t = translations[deviceLanguage];

  const [students, setStudents] = useState([]);

  // list | detail | form
  const [screen, setScreen] = useState('list');

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  // add | edit
  const [formMode, setFormMode] = useState('add');

  const [form, setForm] = useState(emptyForm);

  // ==============================
  // LOAD DATABASE
  // ==============================

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data =
        await AsyncStorage.getItem(STORAGE_KEY);

      if (data) {
        setStudents(JSON.parse(data));
      }
    } catch (error) {
      console.log('Load error:', error);
    }
  };

  const saveToDatabase = async (newStudents) => {
    try {
      setStudents(newStudents);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newStudents)
      );
    } catch (error) {
      console.log('Save error:', error);
    }
  };

  // ==============================
  // NAVIGATION
  // ==============================

  const openDetail = (student) => {
    setSelectedStudent(student);
    setScreen('detail');
  };

  const openAdd = () => {
    setFormMode('add');
    setForm(emptyForm);
    setScreen('form');
  };

  const openEdit = () => {
    setFormMode('edit');

    setForm({
      fullName: selectedStudent.fullName,
      studentCode: selectedStudent.studentCode,
      email: selectedStudent.email,
      avatar: selectedStudent.avatar,
    });

    setScreen('form');
  };

  // ==============================
  // IMAGE PICKER
  // ==============================

  const chooseImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t.imagePermission);
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (!result.canceled) {
      setForm({
        ...form,
        avatar: result.assets[0].uri,
      });
    }
  };

  // ==============================
  // VALIDATE
  // ==============================

  const validateForm = () => {
    if (
      form.fullName.trim() === '' ||
      form.studentCode.trim() === '' ||
      form.email.trim() === ''
    ) {
      Alert.alert(t.required);
      return false;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(form.email.trim())) {
      Alert.alert(t.invalidEmail);
      return false;
    }

    const duplicate = students.some(
      (student) =>
        student.studentCode.toUpperCase() ===
          form.studentCode.trim().toUpperCase() &&
        student.id !== selectedStudent?.id
    );

    if (duplicate) {
      Alert.alert(t.duplicateCode);
      return false;
    }

    return true;
  };

  // ==============================
  // CREATE + UPDATE
  // ==============================

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    // CREATE
    if (formMode === 'add') {
      const newStudent = {
        id: Date.now().toString(),

        fullName: form.fullName.trim(),

        studentCode:
          form.studentCode.trim().toUpperCase(),

        email: form.email.trim(),

        avatar: form.avatar.trim(),
      };

      const newStudents = [
        ...students,
        newStudent,
      ];

      saveToDatabase(newStudents);

      setScreen('list');

      return;
    }

    // UPDATE cần confirm
    Alert.alert(
      t.confirmEditTitle,
      t.confirmEdit,
      [
        {
          text: t.no,
          style: 'cancel',
        },

        {
          text: t.yes,

          onPress: async () => {
            const updatedStudent = {
              ...selectedStudent,

              fullName:
                form.fullName.trim(),

              studentCode:
                form.studentCode
                  .trim()
                  .toUpperCase(),

              email:
                form.email.trim(),

              avatar:
                form.avatar.trim(),
            };

            const newStudents =
              students.map((student) =>
                student.id ===
                selectedStudent.id
                  ? updatedStudent
                  : student
              );

            await saveToDatabase(
              newStudents
            );

            setSelectedStudent(
              updatedStudent
            );

            setScreen('detail');
          },
        },
      ]
    );
  };

  // ==============================
  // DELETE
  // ==============================

  const handleDelete = () => {
    Alert.alert(
      t.confirmDeleteTitle,
      t.confirmDelete,
      [
        {
          text: t.no,
          style: 'cancel',
        },

        {
          text: t.yes,
          style: 'destructive',

          onPress: async () => {
            const newStudents =
              students.filter(
                (student) =>
                  student.id !==
                  selectedStudent.id
              );

            await saveToDatabase(
              newStudents
            );

            setSelectedStudent(null);

            setScreen('list');
          },
        },
      ]
    );
  };

  // ==============================
  // AVATAR
  // ==============================

  const Avatar = ({
    uri,
    name,
    size = 70,
  }) => {
    if (uri) {
      return (
        <Image
          source={{ uri }}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      );
    }

    return (
      <View
        style={[
          styles.avatarFallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.avatarLetter,
            {
              fontSize: size / 2.5,
            },
          ]}
        >
          {name
            ? name.charAt(0).toUpperCase()
            : '?'}
        </Text>
      </View>
    );
  };

  // ==================================================
  // TRANG 2: CHI TIẾT SINH VIÊN
  // ==================================================

  if (
    screen === 'detail' &&
    selectedStudent
  ) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        <View style={styles.page}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() =>
                setScreen('list')
              }
            >
              <Text style={styles.back}>
                ← {t.back}
              </Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {t.studentDetail}
            </Text>

            <View style={{ width: 65 }} />
          </View>

          <View style={styles.detailContent}>
            <Avatar
              uri={
                selectedStudent.avatar
              }
              name={
                selectedStudent.fullName
              }
              size={110}
            />

            <Text
              style={styles.studentNameLarge}
            >
              {selectedStudent.fullName}
            </Text>

            <View style={styles.detailCard}>
              <Text style={styles.label}>
                {t.studentCode}
              </Text>

              <Text style={styles.value}>
                {
                  selectedStudent.studentCode
                }
              </Text>

              <View style={styles.divider} />

              <Text style={styles.label}>
                {t.email}
              </Text>

              <Text style={styles.value}>
                {selectedStudent.email}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.editButton,
                ]}
                onPress={openEdit}
              >
                <Text
                  style={
                    styles.actionButtonText
                  }
                >
                  {t.edit}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.deleteButton,
                ]}
                onPress={handleDelete}
              >
                <Text
                  style={
                    styles.actionButtonText
                  }
                >
                  {t.delete}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==================================================
  // TRANG 3: THÊM / SỬA SINH VIÊN
  // ==================================================

  if (screen === 'form') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : 'height'
          }
        >
          <ScrollView
            contentContainerStyle={
              styles.formScroll
            }
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() =>
                  setScreen(
                    formMode === 'edit'
                      ? 'detail'
                      : 'list'
                  )
                }
              >
                <Text style={styles.back}>
                  ← {t.back}
                </Text>
              </TouchableOpacity>

              <Text style={styles.headerTitle}>
                {formMode === 'add'
                  ? t.addTitle
                  : t.editTitle}
              </Text>

              <View style={{ width: 65 }} />
            </View>

            <View style={styles.form}>
              <View
                style={styles.avatarCenter}
              >
                <Avatar
                  uri={form.avatar}
                  name={form.fullName}
                  size={100}
                />
              </View>

              <Text style={styles.label}>
                {t.fullName}
              </Text>

              <TextInput
                style={styles.input}
                placeholder={
                  t.fullNamePlaceholder
                }
                value={form.fullName}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    fullName: text,
                  })
                }
              />

              <Text style={styles.label}>
                {t.studentCode}
              </Text>

              <TextInput
                style={styles.input}
                placeholder={
                  t.studentCodePlaceholder
                }
                autoCapitalize="characters"
                value={form.studentCode}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    studentCode: text,
                  })
                }
              />

              <Text style={styles.label}>
                {t.email}
              </Text>

              <TextInput
                style={styles.input}
                placeholder={
                  t.emailPlaceholder
                }
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    email: text,
                  })
                }
              />

              <Text style={styles.label}>
                {t.avatar}
              </Text>

              <TextInput
                style={styles.input}
                placeholder={
                  t.avatarPlaceholder
                }
                autoCapitalize="none"
                value={form.avatar}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    avatar: text,
                  })
                }
              />

              <TouchableOpacity
                style={styles.imageButton}
                onPress={chooseImage}
              >
                <Text
                  style={
                    styles.imageButtonText
                  }
                >
                  🖼 {t.chooseImage}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {t.save}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ==================================================
  // TRANG 1: DANH SÁCH SINH VIÊN
  // ==================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.page}>
        <View style={styles.mainHeader}>
          <View>
            <Text style={styles.appName}>
              {t.appName}
            </Text>

            <Text style={styles.subTitle}>
              {t.studentList}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={openAdd}
          >
            <Text style={styles.addButtonText}>
              +
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            students.length === 0 &&
              styles.emptyList,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>
                🎓
              </Text>

              <Text style={styles.emptyText}>
                {t.noStudents}
              </Text>

              <TouchableOpacity
                style={styles.emptyButton}
                onPress={openAdd}
              >
                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  {t.addStudent}
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.studentCard}
              onPress={() =>
                openDetail(item)
              }
            >
              <Avatar
                uri={item.avatar}
                name={item.fullName}
                size={65}
              />

              <View
                style={styles.studentInfo}
              >
                <Text
                  style={
                    styles.studentName
                  }
                >
                  {item.fullName}
                </Text>

                <Text
                  style={
                    styles.studentCode
                  }
                >
                  {item.studentCode}
                </Text>

                <Text
                  style={styles.studentEmail}
                >
                  {item.email}
                </Text>
              </View>

              <Text style={styles.arrow}>
                ›
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// ==================================================
// STYLE
// ==================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  page: {
    flex: 1,
  },

  keyboard: {
    flex: 1,
  },

  mainHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  appName: {
    fontSize: 27,
    fontWeight: '800',
    color: '#202124',
  },

  subTitle: {
    marginTop: 3,
    fontSize: 15,
    color: '#777777',
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,

    backgroundColor: '#3282E8',

    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 34,
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

    paddingBottom: 100,
  },

  emptyIcon: {
    fontSize: 65,
  },

  emptyText: {
    marginTop: 12,
    color: '#777777',
    fontSize: 17,
  },

  emptyButton: {
    marginTop: 18,

    backgroundColor: '#3282E8',

    paddingHorizontal: 22,
    paddingVertical: 12,

    borderRadius: 12,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  studentCard: {
    backgroundColor: '#FFFFFF',

    padding: 14,
    marginBottom: 12,

    borderRadius: 16,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,

    elevation: 2,
  },

  avatar: {
    backgroundColor: '#E5E7EB',
  },

  avatarFallback: {
    backgroundColor: '#3282E8',

    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  studentInfo: {
    flex: 1,
    marginLeft: 14,
  },

  studentName: {
    color: '#202124',
    fontSize: 17,
    fontWeight: '700',
  },

  studentCode: {
    marginTop: 4,
    color: '#555555',
    fontSize: 14,
  },

  studentEmail: {
    marginTop: 2,
    color: '#888888',
    fontSize: 13,
  },

  arrow: {
    color: '#AAAAAA',
    fontSize: 32,
  },

  header: {
    minHeight: 60,

    paddingHorizontal: 18,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  back: {
    color: '#3282E8',
    fontSize: 16,
    fontWeight: '600',
  },

  headerTitle: {
    color: '#202124',
    fontSize: 18,
    fontWeight: '700',
  },

  detailContent: {
    flex: 1,

    alignItems: 'center',

    paddingHorizontal: 20,
    paddingTop: 35,
  },

  studentNameLarge: {
    marginTop: 16,

    color: '#202124',
    fontSize: 25,
    fontWeight: '800',

    textAlign: 'center',
  },

  detailCard: {
    width: '100%',

    marginTop: 30,
    padding: 20,

    backgroundColor: '#FFFFFF',

    borderRadius: 16,
  },

  label: {
    marginTop: 14,
    marginBottom: 6,

    color: '#666666',

    fontSize: 14,
    fontWeight: '600',
  },

  value: {
    color: '#202124',
    fontSize: 18,
    fontWeight: '600',
  },

  divider: {
    height: 1,

    marginVertical: 18,

    backgroundColor: '#EEEEEE',
  },

  actionRow: {
    width: '100%',

    flexDirection: 'row',

    gap: 12,

    marginTop: 20,
  },

  actionButton: {
    flex: 1,

    paddingVertical: 14,

    borderRadius: 12,

    alignItems: 'center',
  },

  editButton: {
    backgroundColor: '#3282E8',
  },

  deleteButton: {
    backgroundColor: '#E53935',
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  formScroll: {
    flexGrow: 1,
  },

  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  avatarCenter: {
    alignItems: 'center',
    marginVertical: 20,
  },

  input: {
    width: '100%',
    height: 50,

    paddingHorizontal: 14,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#D9DDE3',
    borderRadius: 12,

    fontSize: 16,
    color: '#202124',
  },

  imageButton: {
    marginTop: 14,

    paddingVertical: 13,

    borderWidth: 1,
    borderColor: '#3282E8',
    borderRadius: 12,

    alignItems: 'center',
  },

  imageButtonText: {
    color: '#3282E8',
    fontSize: 15,
    fontWeight: '700',
  },

  saveButton: {
    marginTop: 24,

    paddingVertical: 15,

    borderRadius: 12,

    backgroundColor: '#31B46E',

    alignItems: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});