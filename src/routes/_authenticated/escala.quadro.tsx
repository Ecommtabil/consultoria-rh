import { createFileRoute } from '@tanstack/react-router';
import { QuadroPage } from '@/components/escala/quadro';
export const Route = createFileRoute('/_authenticated/escala/quadro')({ component: QuadroPage });
