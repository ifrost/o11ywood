import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { FieldType, MutableDataFrame } from '@grafana/data';

export const totals: FountainToFrameTransformation = (screenaplay: string) => {
  const { basics } = parseScreenplay(screenaplay);
  const data = new MutableDataFrame({
    refId: 'A',
    fields: [
      { name: 'Pages', type: FieldType.number },
      { name: 'Scenes', type: FieldType.number },
    ],
  });
  data.add({ Pages: basics.pages, Scenes: basics.scenes });

  let message = '';
  if (basics.pages > 120 || basics.pages < 80) {
    message += `The screenplay has ${basics.pages} pages. Average screenplay has 80-120 pages. `;
  }
  if (basics.scenes > 120 || basics.scenes < 80) {
    message += `The screenplay has ${basics.scenes.toFixed()} scenes. Average screenplay has 80-120 scenes.`;
  }

  return {
    frames: [data],
    message,
  };
};
