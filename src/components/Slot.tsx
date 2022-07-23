import { defineComponent, ref } from 'vue';
import { SlotProps } from '../props';
import useResizeChange from '../composables/useResizeChange';

export default defineComponent({
  name: 'VirtualListSlot',
  props: SlotProps,
  emits: ['slotResize'],
  setup(props, { slots, emit }) {
    const rootRef = ref<HTMLElement | null>(null);
    useResizeChange(props, rootRef, emit);

    return () => {
      const { tag: Tag, uniqueKey } = props;

      return (
        <Tag ref={rootRef} key={uniqueKey}>
          {slots.default?.()}
        </Tag>
      );
    };
  },
});
