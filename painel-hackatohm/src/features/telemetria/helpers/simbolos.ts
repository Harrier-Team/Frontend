import {
  Circle,
  CircleDashed,
  CircleSlash2,
  Hourglass,
  Info,
  Minus,
  OctagonAlert,
  TriangleAlert,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { EstadoPrincipal } from './estadoHelper';

/** Símbolos de DESIGN.md: a forma comunica o estado mesmo sem cor. */
export const SIMBOLO_ESTADO: Record<EstadoPrincipal, LucideIcon> = {
  Normal: Circle,
  Atencao: Info,
  AlertaPreditivo: TriangleAlert,
  Critico: OctagonAlert,
  offline: WifiOff,
  degradado: CircleSlash2,
  'aguardando-amostras': Hourglass,
  'sem-regras': CircleDashed,
  'sem-leitura': Minus,
};
