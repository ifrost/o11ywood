import {
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { Observable } from 'rxjs';
import { cloneDeep, defaults } from 'lodash';
import { Queries } from './data/transform/transformations';

export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  query(request: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    return new Observable(subscriber => {
      let frames: DataFrame[] = [];
      request.targets.forEach((query: MyQuery) => {
        const transformation = Queries[query.queryType];
        if (transformation) {
          let result = transformation();
          // if (result.length === 1) {
          //   result = result.concat(this.multiplyFrame(result[0]));
          // }
          frames = frames.concat(result);
        }
      });
      subscriber.next({ data: frames });
    });
  }

  private multiplyFrame(frame: DataFrame): DataFrame[] {
    const frames: DataFrame[] = [];
    for (let i = 0; i < 5; i++) {
      const clone = cloneDeep(frame as MutableDataFrame);
      clone.refId = 'BCDEFGH'[i];
      clone.name += '(' + clone.refId + ')';
      frames.push(clone);
    }
    return frames;
  }

  private testData(options: DataQueryRequest): DataQueryResponse {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    // duration of the time range, in milliseconds.
    const resolution = 10;
    const frequency = 0.5;
    const duration = to - from;

    // step determines how close in time (ms) the points will be to each other.
    const step = duration / resolution;

    // Return a constant for each query.
    const data = options.targets.map(target => {
      const query = defaults(target, defaultQuery);
      const frame = new MutableDataFrame({
        refId: query.refId,
        fields: [
          { name: 'time', values: [], type: FieldType.time },
          { name: 'series1', values: [], type: FieldType.number },
          { name: 'series2', values: [], type: FieldType.number },
        ],
      });
      for (let t = 0; t <= duration; t += step) {
        frame.add({ time: from + t, series1: Math.sin((2 * Math.PI * frequency * t) / duration), series2: null });
      }
      for (let t = 0; t <= duration; t += step / 3) {
        frame.add({
          time: from + t,
          series1: null,
          series2: Math.sin((((2 * Math.PI * frequency) / 2) * t) / duration),
        });
      }
      return frame;
    });

    return { data };
  }
}
