import { cssInterop } from 'react-native-css-interop';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';

const sets = [Feather, MaterialCommunityIcons];
sets.forEach((set) => {
  cssInterop(set, {
    className: {
      target: 'style',
      nativeStyleToProp: {
        color: true,
        size: true,
      },
    },
  } as any);
});

export type IconSymbolProps = {
  className?: string;
  color?: string;
  size?: number;
} & (
  | Omit<ComponentProps<typeof Feather>, 'name'>
  | Omit<ComponentProps<typeof MaterialCommunityIcons>, 'name'>
);

function createFeatherIcon(name: string) {
  const Icon = (props: IconSymbolProps) => (
    <Feather name={name as any} {...(props as any)} />
  );
  Icon.displayName = `Feather(${name})`;
  return Icon;
}

function createMCIIcon(name: string) {
  const Icon = (props: IconSymbolProps) => (
    <MaterialCommunityIcons name={name as any} {...(props as any)} />
  );
  Icon.displayName = `MaterialCommunityIcons(${name})`;
  return Icon;
}

export const CreditCard = createFeatherIcon('credit-card');
export const AlertCircle = createFeatherIcon('alert-circle');
export const MessageSquare = createFeatherIcon('message-square');
export const ChevronRight = createFeatherIcon('chevron-right');
export const Zap = createFeatherIcon('zap');
export const Home = createFeatherIcon('home');
export const User = createFeatherIcon('user');
export const Settings = createFeatherIcon('settings');
export const Search = createFeatherIcon('search');
export const Plus = createFeatherIcon('plus');
export const Info = createFeatherIcon('info');
export const Bell = createFeatherIcon('bell');
export const LogOut = createFeatherIcon('log-out');
export const Menu = createFeatherIcon('menu');
export const X = createFeatherIcon('x');
export const Bed = createMCIIcon('bed');
export const Mail = createFeatherIcon('mail');
export const Lock = createFeatherIcon('lock');
export const ArrowRight = createFeatherIcon('arrow-right');
export const MapPin = createFeatherIcon('map-pin');
export const Hash = createFeatherIcon('hash');
export const Ruler = createMCIIcon('ruler');
export const Eye = createFeatherIcon('eye');
export const EyeOff = createFeatherIcon('eye-off');
export const HelpCircle = createFeatherIcon('help-circle');
