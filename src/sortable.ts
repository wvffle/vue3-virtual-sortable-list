import SortableDnd from 'sortable-dnd/src/index.js';
import { reactive, shallowReactive } from 'vue';

// TODO: Get list from props dynamically
export interface DragItem {
  key?: string;
  item: unknown;
  index: number;
}

export interface SortableOptions {
  list: unknown[];
  scrollEl: HTMLElement;
  disabled?: boolean;
  dragging?: boolean;
  draggable: string;
  ghostClass?: string;
  ghostStyle?: string;
  chosenClass?: string;
  getDataKey: (item: unknown) => string;
  onDrag: (from: DragItem, dragEl: HTMLElement) => void;
  onDrop: (
    updatedList: [],
    from: DragItem,
    to: DragItem,
    changed: boolean,
  ) => void;
}

class Sortable {
  list = [] as unknown[];
  cloneList = [] as unknown[];

  drag: SortableDnd = null;
  dragElement: HTMLElement | null = null;
  rangeIsChanged = false;

  dragState = shallowReactive({
    from: { key: undefined, item: undefined, index: -1 },
    to: { key: undefined, item: undefined, index: -1 },
  });

  options = {} as SortableOptions;

  constructor(options: SortableOptions) {
    this.list = options.list;
    this.options = options;

    this.init();
  }

  set(key: keyof SortableOptions, value: never): void {
    if (key === 'list') {
      this.list = value;
      // When the list data changes when dragging, need to execute onDrag function
      if (this.dragElement) this.dragStart(this.dragElement, false);
    } else {
      this.options[key] = value;
      this.drag?.set(key, value);
    }
  }

  init(): void {
    const {
      disabled,
      dragging,
      draggable,
      ghostClass,
      ghostStyle,
      chosenClass,
    } = this.options;

    this.drag = new SortableDnd(this.options.scrollEl, {
      disabled,
      dragging,
      draggable,
      ghostClass,
      ghostStyle,
      chosenClass,
      animation: 0,
      autoScroll: false,
      scrollStep: 5,
      scrollThreshold: 15,
      onChange: (from: DragItem, to: DragItem) => this.onChange(from, to),
      onDrag: (dragEl: HTMLElement) => this.dragStart(dragEl),
      onDrop: (changed: HTMLElement) => this.dragEnd(changed),
    });
  }

  dragStart(dragEl: HTMLElement, callback = true) {
    this.dragElement = dragEl;
    this.cloneList = [...this.list];

    const key = dragEl.getAttribute('data-key');

    this.list.forEach((item, index) => {
      if (this.options.getDataKey(item) === key) {
        this.dragState.from = { item, index, key };
      }
    });

    if (callback) {
      this.rangeIsChanged = false;
      // on-drag callback
      this.options.onDrag(this.dragState.from, dragEl);
    } else {
      this.rangeIsChanged = true;
    }
  }

  onChange(_old_, _new_) {
    const oldKey = this.dragState.from.key;
    const newKey = _new_.node.getAttribute('data-key');

    const from = { item: null, index: -1 };
    const to = { item: null, index: -1 };

    this.cloneList.forEach((el, index) => {
      const key = this.options.getDataKey(el);
      if (key == oldKey) Object.assign(from, { item: el, index });
      if (key == newKey) Object.assign(to, { item: el, index });
    });

    this.cloneList.splice(from.index, 1);
    this.cloneList.splice(to.index, 0, from.item);
  }

  dragEnd(changed) {
    if (this.rangeIsChanged && this.dragElement) this.dragElement.remove();
    const { getDataKey } = this.options;
    const { from } = this.dragState;
    this.cloneList.forEach((el, index) => {
      if (getDataKey(el) == from.key)
        this.dragState.to = {
          index,
          item: this.list[index],
          key: getDataKey(el),
        };
    });
    // on-drop callback
    this.options.onDrop(this.cloneList, from, this.dragState.to, changed);
    this.list = [...this.cloneList];
    this.clear();
  }

  clear() {
    this.dragElement = null;
    this.rangeIsChanged = false;
    this.dragState.from = { key: undefined, item: undefined, index: -1 };
    this.dragState.to = { key: undefined, item: undefined, index: -1 };
  }

  destroy() {
    this.drag && this.drag.destroy();
    this.drag = null;
  }
}

export default Sortable;
