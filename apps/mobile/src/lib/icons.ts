import { cssInterop } from 'react-native-css-interop';
import {
  Home,
  Mail,
  Lock,
  ArrowRight,
  Bed,
  MapPin,
  Hash,
  Ruler,
  CreditCard,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Zap,
  User,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react-native';

const iconList = [
  Home,
  Mail,
  Lock,
  ArrowRight,
  Bed,
  MapPin,
  Hash,
  Ruler,
  CreditCard,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Zap,
  User,
  Settings,
  HelpCircle,
  LogOut,
];

iconList.forEach((icon) => {
  cssInterop(icon, {
    className: {
      target: 'style',
      nativeStyleToProp: {
        color: true,
      },
    },
  });
});

export {
  Home,
  Mail,
  Lock,
  ArrowRight,
  Bed,
  MapPin,
  Hash,
  Ruler,
  CreditCard,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Zap,
  User,
  Settings,
  HelpCircle,
  LogOut,
};
