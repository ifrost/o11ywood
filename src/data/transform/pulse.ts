import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { FieldType, MutableDataFrame } from '@grafana/data';
import { createTempo } from '../../fountain/queries';

export const pulse: FountainToFrameTransformation = (screenaplay: string) => {
  const { parsed, basics } = parseScreenplay(screenaplay);
  const queryRunner = createTempo();
  const results = queryRunner.run(parsed.tokens);

  const averaged = [];

  const averageWindow = Math.ceil(results.length / 300);
  for (let current = averageWindow; current < results.length; current += averageWindow) {
    let total = 0;
    for (let i = current; i >= current - averageWindow && i < results.length; i--) {
      total += results[i].tempo;
    }
    averaged.push(total / averageWindow);
  }

  console.log(averaged);

  const data = new MutableDataFrame({
    fields: [
      { name: 'Page', type: FieldType.number },
      { name: 'Pulse', type: FieldType.number },
    ],
  });

  averaged.forEach((value, index) => {
    data.add({ Page: (index / averaged.length) * basics.pages, Pulse: value });
  });

  return {
    frames: [data],
  };
};
