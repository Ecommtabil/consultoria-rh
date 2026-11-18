import { createFileRoute } from '@tanstack/react-router';
import { EquipePage } from '@/components/escala/equipe';
export const Route = createFileRoute('/_authenticated/escala/equipe')({ component: EquipePage });
