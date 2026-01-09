// Firestore - Users collection and role management
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../client';

// Collection references
const USERS_COLLECTION = 'users';
const USER_ROLES_COLLECTION = 'user_roles';
const ADMIN_REQUESTS_COLLECTION = 'admin_requests';

export type UserRole = 'user' | 'admin' | 'super_admin';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  phoneNumber?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface UserRoleDoc {
  userId: string;
  role: UserRole;
  assignedBy?: string;
  assignedAt: Date | Timestamp;
}

export interface AdminRequest {
  id?: string;
  userId: string;
  email: string;
  status: RequestStatus;
  reviewedBy?: string;
  createdAt: Date | Timestamp;
  reviewedAt?: Date | Timestamp;
}

/**
 * Create user profile in Firestore
 * If this is the first user, automatically make them an admin
 */
export const createUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, {
      uid,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Check if this is the first user - if so, make them admin
    const admins = await getAllAdmins();
    if (admins.length === 0) {
      console.log('First user detected - granting admin privileges');
      await setUserRole(uid, 'super_admin', 'system');
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Get user role
 */
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const roleRef = doc(db, USER_ROLES_COLLECTION, userId);
    const roleSnap = await getDoc(roleRef);
    
    if (roleSnap.exists()) {
      return roleSnap.data().role as UserRole;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
};

/**
 * Check if user is admin
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const role = await getUserRole(userId);
    return role === 'admin' || role === 'super_admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Set user role (admin only)
 */
export const setUserRole = async (
  userId: string,
  role: UserRole,
  assignedBy: string
): Promise<void> => {
  try {
    const roleRef = doc(db, USER_ROLES_COLLECTION, userId);
    await setDoc(roleRef, {
      userId,
      role,
      assignedBy,
      assignedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
};

/**
 * Create admin request
 */
export const createAdminRequest = async (
  userId: string,
  email: string
): Promise<void> => {
  try {
    console.log('Creating admin request for:', email, userId);
    const requestRef = doc(db, ADMIN_REQUESTS_COLLECTION, userId);
    await setDoc(requestRef, {
      userId,
      email,
      status: 'pending' as RequestStatus,
      createdAt: serverTimestamp(),
    });
    console.log('Admin request created successfully for:', email);
  } catch (error) {
    console.error('Error creating admin request:', error);
    throw error;
  }
};

/**
 * Get admin request status
 */
export const getAdminRequestStatus = async (
  userId: string
): Promise<AdminRequest | null> => {
  try {
    const requestRef = doc(db, ADMIN_REQUESTS_COLLECTION, userId);
    const requestSnap = await getDoc(requestRef);
    
    if (requestSnap.exists()) {
      return { id: requestSnap.id, ...requestSnap.data() } as AdminRequest;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin request:', error);
    throw error;
  }
};

/**
 * Get all pending admin requests (admin only)
 */
export const getPendingAdminRequests = async (): Promise<AdminRequest[]> => {
  try {
    const requestsRef = collection(db, ADMIN_REQUESTS_COLLECTION);
    const q = query(requestsRef, where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    const requests: AdminRequest[] = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as AdminRequest);
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting pending requests:', error);
    throw error;
  }
};

/**
 * Update admin request status (admin only)
 */
export const updateAdminRequest = async (
  userId: string,
  status: RequestStatus,
  reviewedBy: string
): Promise<void> => {
  try {
    const requestRef = doc(db, ADMIN_REQUESTS_COLLECTION, userId);
    await updateDoc(requestRef, {
      status,
      reviewedBy,
      reviewedAt: serverTimestamp(),
    });
    
    // If approved, set user role to admin
    if (status === 'approved') {
      await setUserRole(userId, 'admin', reviewedBy);
    }
  } catch (error) {
    console.error('Error updating admin request:', error);
    throw error;
  }
};

/**
 * Get all admins
 */
export const getAllAdmins = async (): Promise<UserRoleDoc[]> => {
  try {
    const rolesRef = collection(db, USER_ROLES_COLLECTION);
    const q = query(rolesRef, where('role', 'in', ['admin', 'super_admin']));
    const querySnapshot = await getDocs(q);
    
    const admins: UserRoleDoc[] = [];
    querySnapshot.forEach((doc) => {
      admins.push(doc.data() as UserRoleDoc);
    });
    
    return admins;
  } catch (error) {
    console.error('Error getting admins:', error);
    throw error;
  }
};

/**
 * Remove user role
 */
export const removeUserRole = async (userId: string): Promise<void> => {
  try {
    const roleRef = doc(db, USER_ROLES_COLLECTION, userId);
    await updateDoc(roleRef, {
      role: 'user' as UserRole,
    });
  } catch (error) {
    console.error('Error removing user role:', error);
    throw error;
  }
};

/**
 * Approve admin request - wrapper for updateAdminRequest
 */
export const approveAdminRequest = async (
  requestId: string,
  userId: string,
  reviewedBy: string
): Promise<void> => {
  try {
    await updateAdminRequest(userId, 'approved', reviewedBy);
  } catch (error) {
    console.error('Error approving admin request:', error);
    throw error;
  }
};

/**
 * Deny admin request - wrapper for updateAdminRequest
 */
export const denyAdminRequest = async (
  requestId: string,
  userId: string,
  reviewedBy: string
): Promise<void> => {
  try {
    await updateAdminRequest(userId, 'rejected', reviewedBy);
  } catch (error) {
    console.error('Error denying admin request:', error);
    throw error;
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: UserRole): Promise<UserRoleDoc[]> => {
  try {
    const rolesRef = collection(db, USER_ROLES_COLLECTION);
    const q = query(rolesRef, where('role', '==', role));
    const querySnapshot = await getDocs(q);
    
    const users: UserRoleDoc[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserRoleDoc);
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

/**
 * Manually create a super admin user
 * Use this function in the browser console if you need to grant admin access
 * Example: import { createSuperAdmin } from '@/integrations/firebase/firestore/users';
 *          createSuperAdmin('user-uid-here');
 */
export const createSuperAdmin = async (userId: string): Promise<void> => {
  try {
    await setUserRole(userId, 'super_admin', 'manual');
    console.log(`Successfully granted super admin privileges to user: ${userId}`);
  } catch (error) {
    console.error('Error creating super admin:', error);
    throw error;
  }
};
