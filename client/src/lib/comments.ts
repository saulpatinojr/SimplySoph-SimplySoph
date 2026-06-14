import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  QueryDocumentSnapshot,
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
  replyCount?: number;
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
  postType: 'blog' | 'video' | 'photo',
  pageSize = 20,
  pageAfter?: QueryDocumentSnapshot
): Promise<{ comments: Comment[]; lastVisible: QueryDocumentSnapshot | null }> {
  const baseQuery = [
    collection(db(), 'comments'),
    where('postId', '==', postId),
    where('postType', '==', postType),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'asc'),
    limit(pageSize),
  ] as const;

  const q = pageAfter ? query(...baseQuery, startAfter(pageAfter)) : query(...baseQuery);
  const snapshot = await getDocs(q);
  return {
    comments: snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[],
    lastVisible: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
  };
}

export async function addComment(data: NewComment): Promise<string> {
  const comment = {
    ...data,
    createdAt: Timestamp.now(),
    status: 'pending', // Require admin approval before comments are publicly visible
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

export async function fetchAllComments(pageSize = 50, pageAfter?: QueryDocumentSnapshot): Promise<{ comments: Comment[]; lastVisible: QueryDocumentSnapshot | null }> {
  const baseQuery = [collection(db(), 'comments'), orderBy('createdAt', 'desc'), limit(pageSize)] as const;
  const q = pageAfter ? query(...baseQuery, startAfter(pageAfter)) : query(...baseQuery);
  const snapshot = await getDocs(q);
  return {
    comments: snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[],
    lastVisible: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
  };
}
