# Quick Testing Checklist - December 14, 2025

## ✅ Completed Work
- Analytics event tracking wired in all interactive components
- Authentication navigation fixed (button → anchor tag)
- Dev server running on port 5174

---

## 🧪 Manual Testing Required

### 1. **Authentication Flow** (PRIORITY: CRITICAL)
**Steps:**
1. Open http://localhost:5174 in browser
2. Click "Join the journey" button in navigation
3. **Expected:** Navigate to `/login` page
4. Click "Continue with Google" button
5. **Expected:** Google sign-in popup appears
6. Complete sign-in with Google account
7. **Expected:** Redirect to `/admin` dashboard after login

**Status:** ⏳ PENDING USER TEST

---

### 2. **Hero Banner Visual Verification** (PRIORITY: HIGH)
**Steps:**
1. Hard refresh homepage (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache if needed
3. Check if Material Symbols icons render correctly (not as text)
4. Verify icons positioned around title (not overlapping)
5. Check title gradient and shimmer animation
6. Verify tagline spacing below title

**Expected Results:**
- ✅ Icons display as symbols (hanger, shirt, perfume, camera, airplane)
- ✅ Icons positioned around title with proper spacing
- ✅ Title shows gradient with shimmer effect
- ✅ Tagline properly spaced below title
- ✅ Warm brand colors (caramel/gold tones)

**Status:** ⏳ PENDING USER TEST

---

### 3. **Analytics Event Verification** (PRIORITY: MEDIUM)
**Steps:**
1. Open Firebase Console → Analytics → DebugView
2. Enable debug mode in browser (see Firebase docs)
3. Perform actions to trigger events:
   - Post a comment → Check for `comment_create` event
   - Reply to comment → Check for `comment_reply` event
   - Delete comment → Check for `comment_delete` event
   - Open newsletter modal → Check for `newsletter_open` event
   - Submit newsletter → Check for `newsletter_submit` event
   - Dismiss newsletter → Check for `newsletter_dismiss` event
   - Search for content → Check for `search_query` event
   - Click search result → Check for `search_result_click` event
   - Approve comment (admin) → Check for `moderation_approve` event
   - Flag comment (admin) → Check for `moderation_flag` event
   - Delete comment (admin) → Check for `moderation_delete` event

**Expected Results:**
- ✅ All events appear in Firebase Analytics DebugView
- ✅ Events include correct parameters (post IDs, result counts, etc.)

**Status:** ⏳ PENDING USER TEST

---

### 4. **Full Interactive Features QA** (PRIORITY: MEDIUM)

Follow comprehensive testing guide in `docs/TESTING_GUIDE.md`:

**Comment System:**
- [ ] Post comment on blog post
- [ ] Reply to comment (threading works)
- [ ] Delete own comment
- [ ] Admin: Moderate comments (approve/flag/delete)
- [ ] Verify stats on admin dashboard

**Newsletter Modal:**
- [ ] Modal appears after 10 seconds
- [ ] Email validation works
- [ ] Successful subscription
- [ ] Dismissal persists for 30 days
- [ ] Duplicate email handling

**Search:**
- [ ] Search returns results (blogs, videos, albums)
- [ ] Debounce works (300ms delay)
- [ ] Click result navigates correctly
- [ ] No results message displays when appropriate

**Admin Moderation:**
- [ ] View all comments
- [ ] Filter by status (all/approved/pending/flagged)
- [ ] Approve/flag/delete actions work
- [ ] Stats update in real-time

**Status:** ⏳ PENDING AFTER AUTH FIX

---

## 🔍 Known Issues to Watch For

1. **Font Loading**: Material Symbols may take a moment to load on first visit
   - **Solution:** Hard refresh if icons appear as text initially

2. **Browser Cache**: Changes may not appear due to cached assets
   - **Solution:** Hard refresh (Ctrl+Shift+R) or clear cache

3. **Popup Blockers**: Browser may block Google sign-in popup
   - **Solution:** Allow popups for localhost, or use redirect flow

4. **Dev Server Port**: Running on 5174 (not default 5173)
   - **Reason:** Port 5173 was already in use

---

## 📊 Success Criteria

### Authentication ✅
- [x] Code changes implemented
- [ ] Button navigates to login page
- [ ] Google popup appears
- [ ] Sign-in redirects to admin

### Analytics ✅
- [x] Code changes implemented
- [ ] Events tracked in Firebase Console
- [ ] Event parameters correct

### Hero Banner ⏳
- [x] Code changes implemented
- [ ] Visual verification by user
- [ ] Icons render correctly
- [ ] Spacing and animations correct

---

## 🚀 Next Actions

1. **YOU**: Test authentication flow (click "Join the journey")
2. **YOU**: Hard refresh and verify hero banner visuals
3. **YOU**: Enable Firebase Analytics debug mode
4. **YOU**: Follow TESTING_GUIDE.md for comprehensive QA
5. **AGENT**: Fix any issues found during testing
6. **AGENT**: Mark tasks complete in todo.md

---

*Last Updated: December 14, 2025, 5:45 PM*  
*Dev Server: http://localhost:5174*  
*Status: Ready for User Testing*
