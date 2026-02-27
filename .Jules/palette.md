## 2024-10-24 - Hidden Focusable Element Pattern
**Learning:** Elements that are hidden by default (e.g., opacity-0) but become visible on hover (group-hover:opacity-100) are difficult to navigate via keyboard. They are technically focusable if they are buttons, but the user cannot see where the focus is.
**Action:** Always add 'focus-visible:opacity-100' alongside 'group-hover:opacity-100' for interactive elements. Also, ensure a clear focus ring is visible using 'focus-visible:ring-*' utilities.
