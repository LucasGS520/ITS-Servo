import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/common/ui/toast";

/** Limite máximo de notificações exibidas simultaneamente */
const TOAST_LIMIT = 1;

/** Tempo em milissegundos para remover um toast após ser descartado */
const TOAST_REMOVE_DELAY = 1000000;

/**
 * Tipo que representa um toast com suas propriedades estendidas
 * - Identificador único do toast
 * - Título opcional do toast
 * - Descrição opcional do toast
 * - Ação opcional associada ao toast
 */
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

/** Tipos de ações disponíveis para o redutor de toasts */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

/** Contador global para gerar IDs únicos para cada toast */
let count = 0;

/**
 * Gera um ID único para cada novo toast
 * Um identificador único em formato string
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

/**
 * Tipo que define as possíveis ações que podem ser despachadas no redutor
 * Inclui adição, atualização, descarte e remoção de toasts
 */
type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

/** Estado que armazena a lista de toasts */
interface State {
  toasts: ToasterToast[];
}

/** Mapa que armazena os timeouts agendados para remover toasts */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Adiciona um toast à fila de remoção com delay
 * - ID do toast a ser removido
 */
const addToRemoveQueue = (toastId: string) => {
  // Verifica se o toast já está na fila
  if (toastTimeouts.has(toastId)) {
    return;
  }

  // Cria um timeout para remover o toast após o delay
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/**
 * Redutor que processa as ações de gerenciamento de toasts
 * - Estado atual dos toasts
 * - Ação a ser processada
 * Novo estado após aplicar a ação
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    // Adiciona um novo toast ao topo da lista, respeitando o limite máximo
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    // Atualiza um toast existente com novas propriedades
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    // Descarta um ou todos os toasts, adicionando-os à fila de remoção
    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Efeitos colaterais ! - Isso poderia ser extraído para uma ação separada,
      // mas mantém-se aqui por simplicidade
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        // Se nenhum ID específico, descarta todos os toasts
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }

    // Remove um toast do estado ou limpa todos
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

/** Array de listeners que são notificados quando o estado muda */
const listeners: Array<(state: State) => void> = [];

/** Estado em memória compartilhado entre todas as instâncias */
let memoryState: State = { toasts: [] };

/**
 * Dispara uma ação, atualizando o estado em memória e notificando todos os listeners
 * - Ação a ser despachada
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  // Notifica todos os listeners sobre a mudança de estado
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

/** Tipo que representa um toast sem seu ID (ID é gerado automaticamente) */
type Toast = Omit<ToasterToast, "id">;

/**
 * Função para criar e exibir um novo toast
 * - Propriedades do toast (título, descrição, ação, etc)
 * Objeto com ID do toast, funções dismiss e update
 */
function toast({ ...props }: Toast) {
  const id = genId();

  // Função para atualizar as propriedades do toast
  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });

  // Função para descartar o toast
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  // Dispara ação para adicionar o novo toast
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      // Descarta o toast quando a mudança de estado open é para false
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

/**
 * Hook que gerencia o estado dos toasts
 * Sincroniza o estado local com o estado em memória compartilhado
 * Objeto contendo lista de toasts, funções toast e dismiss
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  // Registra o setState como listener para mudanças de estado
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      // Remove o listener quando o componente é desmontado
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
