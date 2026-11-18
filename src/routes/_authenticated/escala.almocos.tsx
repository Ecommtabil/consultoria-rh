import { createFileRoute } from '@tanstack/react-router';
import { AlmocosPage } from '@/components/escala/almocos';
export const Route = createFileRoute('/_authenticated/escala/almocos')({ component: AlmocosPage });
