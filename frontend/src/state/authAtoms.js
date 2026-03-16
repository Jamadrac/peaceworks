import { atom } from 'recoil'

// Persistence helper similar to jotai's atomWithStorage
const localStorageEffect = (key) => ({ setSelf, onSet }) => {
  if (typeof window === 'undefined') return

  const saved = localStorage.getItem(key)
  if (saved != null) {
    try {
      setSelf(JSON.parse(saved))
    } catch {
      // ignore malformed storage
    }
  }

  onSet((newValue, _, isReset) => {
    if (isReset) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(newValue))
    }
  })
}

export const defaultUserState = {
  userId: null,
  username: null,
  firstName: null,
  lastName: null,
  middleName: null,
  email: null,
  phoneNumber: null,
  role: null,
  jobTitle: null,
  group: null,
  isEmailVerified: null,
  bloodGroup: null,
  address: null,
  dateOfBirth: null,
  gender: null,
  emergencyContact: null,
  nrc_card_id: null,
  bio: null,
  location: null,
  profilePicture: null,
  skills: [],
  languages: [],
  // Store and warehouse assignments
  storeIds: [],
  storeNames: [],
  warehouseIds: [],
  warehouseNames: [],
  // Primary store/warehouse for current context
  currentStoreId: null,
  currentStoreName: null,
  currentWarehouseId: null,
  currentWarehouseName: null,
  createdAt: null,
}

export const userState = atom({
  key: 'userState',
  default: defaultUserState,
  effects: [localStorageEffect('userState')],
})

export const authState = atom({
  key: 'authState',
  default: false,
  effects: [localStorageEffect('authState')],
})

export const companyNameState = atom({
  key: 'companyNameState',
  default: 'Inventory System',
  effects: [localStorageEffect('companyNameState')],
})

export const systemSettingsState = atom({
  key: 'systemSettingsState',
  default: null,
  effects: [localStorageEffect('systemSettingsState')],
})
