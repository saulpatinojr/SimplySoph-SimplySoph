import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase';

const db = () => getFirebaseFirestore();

export interface Comment {
  id: string;
  postId: string;
  postType: 'blog' | 'video' | 'photo';
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  parentId?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  status: 'pending' | 'approved' | 'flagged';
}

export interface NewComment {
  postId: string;
  postType: 'blog' | 'video' | 'photo';
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  parentId?: string;
}

export async function fetchComments(
  postId: string,
  postType: 'blog' | 'video' | 'photo'
): Promise<Comment[]> {
  const q = query(
    collection(db(), 'comments'),
    where('postId', '==', postId),
    where('postType', '==', postType),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Comment[];
}

export async function addComment(data: NewComment): Promise<string> {
  const comment = {
    ...data,
    createdAt: Timestamp.now(),
    status: 'approved', // Auto-approve for now; add moderation later
  };

  const docRef = await addDoc(collection(db(), 'comments'), comment);
  return docRef.id;
}

export async function deleteComment(commentId: string): Promise<void> {
  await deleteDoc(doc(db(), 'comments', commentId));
}

export async function moderateComment(
  commentId: string,
  status: 'approved' | 'flagged' | 'pending'
): Promise<void> {
  await updateDoc(doc(db(), 'comments', commentId), {
    status,
    updatedAt: Timestamp.now(),
  });
}

export async function fetchAllComments(): Promise<Comment[]> {
  const q = query(collection(db(), 'comments'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Comment[];
}
