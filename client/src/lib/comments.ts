import {
  collection,
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
import { getFirebaseAuth } from './firebase';
import { API_BASE } from '@/const';

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
  const auth = getFirebaseAuth();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

  const payload = {
    postId: data.postId,
    postType: data.postType,
    content: data.content,
    parentId: data.parentId,
    guestName: token ? undefined : data.authorName,
  };

  const res = await fetch(`${API_BASE}/comments/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as { error?: string };
    const error = new Error(errorBody.error || 'Failed to create comment') as Error & {
      code?: string;
    };
    error.code = res.status === 429 ? 'resource-exhausted' : 'unknown';
    throw error;
  }

  const body = (await res.json()) as { id: string };
  return body.id;
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
