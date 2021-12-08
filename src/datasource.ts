import {
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  FieldType,
  MetricFindValue,
  MutableDataFrame,
} from '@grafana/data';
import { DataSourceWithBackend, getBackendSrv, getTemplateSrv, toDataQueryResponse } from '@grafana/runtime';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { Observable, of } from 'rxjs';
import { cloneDeep, defaults } from 'lodash';
import { Queries } from './data/transform/transformations';
import { VariableSupport } from './VariableSupport';

export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  async getContent(fileName: string): Promise<string> {
    const screenplay = await getBackendSrv()
      .fetch({
        url: '/api/ds/query',
        method: 'POST',
        data: {
          queries: [{ datasource: this.getRef(), listFiles: true, getContent: fileName }],
        },
      })
      .toPromise();

    return screenplay.data.results.A.frames[0].schema.meta.custom.Content;
  }

  async getFiles(): Promise<string[]> {
    const screenplay = await getBackendSrv()
      .fetch({
        url: '/api/ds/query',
        method: 'POST',
        data: {
          queries: [{ datasource: this.getRef(), listFiles: true, getContent: '' }],
        },
      })
      .toPromise();

    return screenplay.data.results.A.frames[0].schema.meta.custom.Files;
  }

  getTagValues(options?: any): Promise<MetricFindValue[]> {
    return this.getFiles().then(files => {
      return files.map(file => {
        return {
          text: file,
        };
      });
    });
  }

  getTagKeys(options?: any): Promise<MetricFindValue[]> {
    return Promise.resolve([{ text: 'file' }]);
  }

  query(request: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    const adhocFilters = getTemplateSrv().getAdhocFilters(this.name);
    const files = adhocFilters.map(filter => {
      return filter.value;
    });
    const adHocFile = files.length && files[0];

    return new Observable(subscriber => {
      this.getContent(adHocFile || request.targets[0].file).then(content => {
        let frames: DataFrame[] = [];
        let errorMessage = '';
        request.targets.forEach((query: MyQuery) => {
          const transformation = Queries[query.queryType];
          if (transformation) {
            let result = transformation(content);
            // if (result.length === 1) {
            //   result = result.concat(this.multiplyFrame(result[0]));
            // }
            frames = frames.concat(result.frames);
            errorMessage += result.message || '';
          }
        });
        const response: DataQueryResponse = { data: frames };
        if (errorMessage) {
          response.error = { message: errorMessage };
        }
        subscriber.next(response);
      });
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
