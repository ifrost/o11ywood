import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { FieldType, MutableDataFrame } from '@grafana/data';

export const stub: FountainToFrameTransformation = (screenaplay: string) => {
  const { basics } = parseScreenplay(screenaplay);
  const data = new MutableDataFrame({
    fields: [{ name: 'field', type: FieldType.number }],
  });
  data.add({ field: 1 });

  let message = '';
  if (false) {
    message = 'error';
  }

  return {
    frames: [data],
    message,
  };
};
