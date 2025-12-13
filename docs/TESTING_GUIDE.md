# Testing Guide - Interactive Features

## Quick Start Testing (5 Minutes)

### 1. Comment System Testing 💬

**On Public Site:**
1. Navigate to any blog post
2. Scroll to bottom - verify Comments section appears
3. Click "Sign In to Comment" if not authenticated
4. After login, post a test comment
5. Reply to your comment (test threading)
6. Delete your comment (verify deletion works)

**In Admin:**
1. Go to `/admin` dashboard
2. Click "Moderate Comments" card
3. Verify your test comment appears
4. Test filters: All → Pending → Approved
5. Click "Flag" on a comment
6. Click "Approve" to restore it
7. Test "Delete" with confirmation

**Expected Results:**
- ✅ Comments post instantly
- ✅ Replies nest correctly (max 3 levels)
- ✅ Delete removes comment immediately
- ✅ Admin can see all comments
- ✅ Filtering works correctly

---

### 2. Newsletter Modal Testing 📧

**Test Flow:**
1. Open homepage in incognito/private window
2. Wait 10 seconds - modal should appear automatically
3. Enter email: `test@example.com`
4. Enter name: `Test User`
5. Click "Subscribe"
6. Verify success toast appears
7. Check Firestore Console → `newsletterSubscribers` collection

**Test Dismissal Logic:**
1. Refresh page, wait 10s - modal should NOT appear
2. Check localStorage: `newsletter_subscribed` = "true"
3. Clear localStorage
4. Refresh page, click "Maybe Later"
5. Check localStorage: `newsletter_dismissed` = timestamp
6. Refresh - should not show for 30 days

**Expected Results:**
- ✅ Modal appears after 10 seconds
- ✅ Form validation works (email required)
- ✅ Success toast on subscription
- ✅ Duplicate email shows "Already subscribed"
- ✅ Dismissal persists for 30 days

---

### 3. Search Integration Testing 🔍

**Basic Search:**
1. Click search icon in navigation (magnifying glass)
2. Type "fashion" in search box
3. Verify results appear after ~300ms
4. Check badges show content type (blog/video/photo)
5. Click a result - should navigate correctly
6. Close dialog by clicking outside

**Advanced Testing:**
1. Search for content that doesn't exist: "xyzabc"
2. Verify "No results" message
3. Search for partial word: "styl" → should find "style"
4. Verify results sorted by date (newest first)

**Firestore Verification:**
1. Open Firestore Console
2. Check any blog/video document
3. Verify `searchTokens` array field exists
4. Tokens should be lowercase, >2 characters

**Expected Results:**
- ✅ Debounced search (waits 300ms)
- ✅ Multi-collection results (blogs, videos, albums)
- ✅ Clear button clears query
- ✅ Click outside closes dialog
- ✅ Results link to correct pages

---

### 4. Admin Moderation Dashboard Testing 🛡️

**Access:**
1. Go to `/admin/comments` directly
2. OR from `/admin` → Click "Moderate Comments"

**Statistics Verification:**
1. Verify stats cards show correct counts:
   - Total Comments
   - Approved (green)
   - Pending (yellow)
   - Flagged (red)

**Filtering:**
1. Select "All Comments" → Shows everything
2. Select "Approved" → Only approved comments
3. Select "Pending" → Only pending
4. Select "Flagged" → Only flagged

**Moderation Actions:**
1. Find a pending comment
2. Click "Approve" → Status changes, stats update
3. Click "Flag" → Badge turns red
4. Click "Delete" → Confirmation appears
5. Confirm deletion → Comment removed, stats update

**Expected Results:**
- ✅ Stats accurate and real-time
- ✅ Filters work instantly
- ✅ Actions update UI immediately
- ✅ Toast notifications on success
- ✅ Confirmation on delete

---

## Firestore Console Verification

### Comments Collection
```javascript
// Expected document structure:
{
  postId: "abc123",
  postType: "blog",
  content: "Great post!",
  authorId: "user123",
  authorName: "John Doe",
  authorPhotoURL: "https://...",
  parentId: null, // or parent comment ID for replies
  status: "approved", // or "pending", "flagged"
  createdAt: Timestamp,
  updatedAt: Timestamp (optional)
}
```

**Verify:**
- [ ] Comments collection exists
- [ ] Test comments visible
- [ ] Status field correct
- [ ] Timestamps populated

### Newsletter Subscribers Collection
```javascript
// Expected document structure:
{
  email: "test@example.com",
  name: "Test User",
  subscribedAt: Timestamp,
  status: "active",
  source: "/about" // page where subscribed
}
```

**Verify:**
- [ ] newsletterSubscribers collection exists
- [ ] Test subscription visible
- [ ] Email lowercase
- [ ] Source captured

### Content Documents (searchTokens)
```javascript
// blogs/videos should have:
{
  title: "Fashion Tips",
  content: "...",
  searchTokens: ["fashion", "tips", "style", ...],
  // ... other fields
}
```

**Verify:**
- [ ] searchTokens array exists
- [ ] Tokens lowercase
- [ ] Tokens >2 characters
- [ ] Auto-generated on save

---

## Security Rules Testing

### Comments (Test with different users)

**Authenticated User:**
- ✅ Can read approved comments
- ✅ Can post new comment
- ✅ Can delete own comment
- ❌ Cannot delete others' comments
- ❌ Cannot moderate (change status)

**Admin User:**
- ✅ Can read all comments (any status)
- ✅ Can approve/flag/delete any comment
- ✅ Full moderation access

**Unauthenticated User:**
- ✅ Can read approved comments
- ❌ Cannot post comments
- ❌ Cannot delete comments

### Newsletter

**Anyone:**
- ✅ Can create subscription
- ✅ Can update own subscription (for unsubscribe)
- ❌ Cannot read subscriber list

**Admin:**
- ✅ Can read all subscribers
- ✅ Can delete subscribers

---

## Performance Testing

### Page Load Times
- **Blog Post** (with comments): <2s
- **Search Dialog**: Opens instantly (<100ms)
- **Admin Moderation**: <1.5s

### Search Performance
- **Query Time**: <300ms for typical queries
- **Results Display**: <100ms render
- **Debounce**: 300ms wait after typing stops

### Bundle Sizes
- **Main Bundle**: 403KB (acceptable)
- **Comment Moderation**: 58KB (lazy-loaded)
- **Total First Load**: ~450KB

---

## Common Issues & Solutions

### Comment Not Posting
- **Check**: User is authenticated
- **Check**: Firestore rules allow creation
- **Check**: Browser console for errors

### Newsletter Modal Not Appearing
- **Check**: 10 seconds have passed
- **Check**: localStorage doesn't have `newsletter_subscribed`
- **Check**: Not dismissed in last 30 days

### Search Returns No Results
- **Check**: Content has `searchTokens` field
- **Check**: Tokens generated correctly
- **Check**: Query >2 characters

### Admin Can't See Comments
- **Check**: User role is "admin"
- **Check**: Logged in with correct account
- **Check**: Firestore rules allow admin read

---

## Automated Testing (Future)

### Unit Tests Needed
- [ ] Comment CRUD functions
- [ ] Search token generation
- [ ] Newsletter subscription logic

### Integration Tests Needed
- [ ] Comment posting flow
- [ ] Admin moderation workflow
- [ ] Search query → results display

### E2E Tests Needed
- [ ] Full comment lifecycle (post → reply → delete)
- [ ] Newsletter subscription → dismissal → cooldown
- [ ] Search → click result → navigation

---

## Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Document edge cases** in ISSUES.md
3. **Add analytics tracking** for:
   - Comment post events
   - Newsletter signup events
   - Search query events
4. **Optimize performance** if needed
5. **Add spam protection** (reCAPTCHA v3)

---

*Last Updated: January 17, 2025*  
*Version: 0.4.0*  
*Testing Checklist for Interactive Features*
