export interface ActionScript {
  id: string;
  event_type: string;
  sub_condition?: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type CreateActionScriptDTO = Omit<ActionScript, 'id' | 'created_at' | 'updated_at'>;
export type UpdateActionScriptDTO = Partial<CreateActionScriptDTO>;
