import { createFileRoute } from '@tanstack/react-router';
import { ComparativoPage } from '@/components/escala/comparativo';
export const Route = createFileRoute('/_authenticated/escala/comparativo')({ component: ComparativoPage });
