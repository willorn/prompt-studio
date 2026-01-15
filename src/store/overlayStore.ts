import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastItem extends Required<ToastOptions> {
  id: string;
  createdAt: number;
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

interface ConfirmState extends Required<Omit<ConfirmOptions, 'description'>> {
  description?: string;
}

export interface PromptOptions {
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  validate?: (value: string) => string | null;
}

export type UnsavedChangesResult = 'keep' | 'discard' | 'cancel';

export interface UnsavedChangesOptions {
  title: string;
  description?: string;
  keepText?: string;
  discardText?: string;
  cancelText?: string;
}

interface UnsavedChangesState extends Required<Omit<UnsavedChangesOptions, 'description'>> {
  description?: string;
}

interface PromptState
  extends Required<
    Omit<PromptOptions, 'description' | 'label' | 'placeholder' | 'initialValue' | 'validate'>
  > {
  description?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  validate?: (value: string) => string | null;
}

interface OverlayState {
  toasts: ToastItem[];
  confirm: ConfirmState | null;
  prompt: PromptState | null;
  unsavedChanges: UnsavedChangesState | null;

  // 注意：resolver 用于把用户选择返回给调用方（Promise）。它是运行时函数，属于 UI 层逻辑。
  confirmResolver: ((result: boolean) => void) | null;
  promptResolver: ((result: string | null) => void) | null;
  unsavedChangesResolver: ((result: UnsavedChangesResult) => void) | null;

  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  confirmAsync: (options: ConfirmOptions) => Promise<boolean>;
  resolveConfirm: (result: boolean) => void;

  promptAsync: (options: PromptOptions) => Promise<string | null>;
  resolvePrompt: (result: string | null) => void;

  unsavedChangesAsync: (options: UnsavedChangesOptions) => Promise<UnsavedChangesResult>;
  resolveUnsavedChanges: (result: UnsavedChangesResult) => void;
}

export const useOverlayStore = create<OverlayState>((set, get) => ({
  toasts: [],
  confirm: null,
  prompt: null,
  unsavedChanges: null,
  confirmResolver: null,
  promptResolver: null,
  unsavedChangesResolver: null,

  showToast: ({ message, variant = 'info', durationMs = 3000 }) => {
    const id = nanoid();
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          message,
          variant,
          durationMs,
          createdAt: Date.now(),
        },
      ],
    }));
    return id;
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  confirmAsync: async (options) => {
    const existingResolver = get().confirmResolver;
    if (existingResolver) {
      existingResolver(false);
    }

    const confirmState: ConfirmState = {
      title: options.title,
      description: options.description,
      confirmText: options.confirmText ?? '确定',
      cancelText: options.cancelText ?? '取消',
      variant: options.variant ?? 'default',
    };

    return new Promise<boolean>((resolve) => {
      set({
        confirm: confirmState,
        confirmResolver: resolve,
      });
    });
  },

  resolveConfirm: (result) => {
    const resolver = get().confirmResolver;
    if (resolver) resolver(result);
    set({ confirm: null, confirmResolver: null });
  },

  promptAsync: async (options) => {
    const existingResolver = get().promptResolver;
    if (existingResolver) {
      existingResolver(null);
    }

    const promptState: PromptState = {
      title: options.title,
      description: options.description,
      label: options.label,
      placeholder: options.placeholder,
      initialValue: options.initialValue ?? '',
      confirmText: options.confirmText ?? '确定',
      cancelText: options.cancelText ?? '取消',
      validate: options.validate,
    };

    return new Promise<string | null>((resolve) => {
      set({
        prompt: promptState,
        promptResolver: resolve,
      });
    });
  },

  resolvePrompt: (result) => {
    const resolver = get().promptResolver;
    if (resolver) resolver(result);
    set({ prompt: null, promptResolver: null });
  },

  unsavedChangesAsync: async (options) => {
    const existingResolver = get().unsavedChangesResolver;
    if (existingResolver) {
      existingResolver('cancel');
    }

    const state: UnsavedChangesState = {
      title: options.title,
      description: options.description,
      keepText: options.keepText ?? '保留',
      discardText: options.discardText ?? '丢弃',
      cancelText: options.cancelText ?? '取消',
    };

    return new Promise<UnsavedChangesResult>((resolve) => {
      set({
        unsavedChanges: state,
        unsavedChangesResolver: resolve,
      });
    });
  },

  resolveUnsavedChanges: (result) => {
    const resolver = get().unsavedChangesResolver;
    if (resolver) resolver(result);
    set({ unsavedChanges: null, unsavedChangesResolver: null });
  },
}));
