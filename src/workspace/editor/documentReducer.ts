import type { ContentBlock, DocumentBody, TextMark } from '../types/document';
import {
  applyMarksToSelection,
  createBlock,
  findReplaceInBody,
  plainFromSpans,
} from '../utils/blocks';

export type EditorCommand =
  | { type: 'setBody'; body: DocumentBody }
  | { type: 'updateBlock'; blockId: string; patch: Partial<ContentBlock> }
  | { type: 'setBlockText'; blockId: string; text: string }
  | { type: 'toggleMark'; blockId: string; mark: TextMark; selectedText?: string }
  | { type: 'addBlock'; afterId?: string; block: ContentBlock }
  | { type: 'removeBlock'; blockId: string }
  | { type: 'moveBlock'; blockId: string; direction: 'up' | 'down' }
  | { type: 'findReplace'; find: string; replace: string; all: boolean }
  | { type: 'replaceSelectionText'; blockId: string; selectedText: string; nextText: string }
  | { type: 'undo' }
  | { type: 'redo' };

export interface EditorState {
  body: DocumentBody;
  past: DocumentBody[];
  future: DocumentBody[];
}

export function createEditorState(body: DocumentBody): EditorState {
  return { body, past: [], future: [] };
}

function pushHistory(state: EditorState, nextBody: DocumentBody): EditorState {
  return {
    body: nextBody,
    past: [...state.past, state.body].slice(-80),
    future: [],
  };
}

export function editorReducer(state: EditorState, command: EditorCommand): EditorState {
  switch (command.type) {
    case 'setBody':
      return pushHistory(state, command.body);
    case 'undo': {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        body: previous,
        past: state.past.slice(0, -1),
        future: [state.body, ...state.future].slice(0, 80),
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return {
        body: next,
        past: [...state.past, state.body].slice(-80),
        future: rest,
      };
    }
    case 'updateBlock':
      return pushHistory(state, {
        ...state.body,
        blocks: state.body.blocks.map((b) =>
          b.id === command.blockId ? { ...b, ...command.patch } : b,
        ),
      });
    case 'setBlockText':
      return pushHistory(state, {
        ...state.body,
        blocks: state.body.blocks.map((b) =>
          b.id === command.blockId
            ? { ...b, spans: [{ text: command.text, marks: b.spans?.[0]?.marks }] }
            : b,
        ),
      });
    case 'toggleMark': {
      return pushHistory(state, {
        ...state.body,
        blocks: state.body.blocks.map((b) => {
          if (b.id !== command.blockId) return b;
          const selected = command.selectedText || plainFromSpans(b.spans);
          const has = (b.spans ?? []).some((s) => s.marks?.includes(command.mark));
          return {
            ...b,
            spans: applyMarksToSelection(b.spans ?? [], selected, command.mark, !has),
          };
        }),
      });
    }
    case 'addBlock': {
      const blocks = [...state.body.blocks];
      if (!command.afterId) {
        blocks.push(command.block);
      } else {
        const idx = blocks.findIndex((b) => b.id === command.afterId);
        blocks.splice(idx + 1, 0, command.block);
      }
      return pushHistory(state, { ...state.body, blocks });
    }
    case 'removeBlock': {
      const blocks = state.body.blocks.filter((b) => b.id !== command.blockId);
      return pushHistory(state, {
        ...state.body,
        blocks: blocks.length ? blocks : [createBlock('paragraph', '')],
      });
    }
    case 'moveBlock': {
      const blocks = [...state.body.blocks];
      const idx = blocks.findIndex((b) => b.id === command.blockId);
      if (idx < 0) return state;
      const target = command.direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= blocks.length) return state;
      const [item] = blocks.splice(idx, 1);
      blocks.splice(target, 0, item);
      return pushHistory(state, { ...state.body, blocks });
    }
    case 'findReplace':
      return pushHistory(
        state,
        findReplaceInBody(state.body, command.find, command.replace, command.all),
      );
    case 'replaceSelectionText':
      return pushHistory(state, {
        ...state.body,
        blocks: state.body.blocks.map((b) => {
          if (b.id !== command.blockId) return b;
          const plain = plainFromSpans(b.spans);
          const next = plain.replace(command.selectedText, command.nextText);
          return { ...b, spans: [{ text: next }] };
        }),
      });
    default:
      return state;
  }
}
