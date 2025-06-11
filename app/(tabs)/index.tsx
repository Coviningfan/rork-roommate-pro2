// Update the colors import and Avatar size
import { colors } from '@/constants/Colors';
// ... rest of the imports stay the same

// Inside the component, update the Avatar size prop
<Avatar 
  source={user?.photoURL} 
  name={user?.displayName || user?.email} 
  size={isTablet ? "large" : "medium"} 
/>