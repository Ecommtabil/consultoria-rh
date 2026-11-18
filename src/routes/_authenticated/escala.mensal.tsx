import { createFileRoute } from '@tanstack/react-router';
import { MensalPage } from '@/components/escala/mensal';
export const Route = createFileRoute('/_authenticated/escala/mensal')({ component: MensalPage });
