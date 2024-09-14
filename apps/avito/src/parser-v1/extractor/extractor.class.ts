import { extractAddress } from './address';
import { extractAreas } from './areas';
import { extractDeposit } from './deposit';
import { extractDescription } from './description';
import { extractObjectType } from './object-type';
import { extractPhotos } from './photos';
import { extractSeller } from './seller';
import { extractStorey } from './storey';

export class AvitoExtractor {
  public readonly viewdata: Record<string, any>;
  public readonly region: string;
  public readonly city: string;

  constructor(props: {
    viewdata: Record<string, any>;
    region: string;
    city: string;
  }) {
    this.viewdata = props.viewdata;
    this.region = props.region;
    this.city = props.city;
  }

  public geocord() {
    return {
      lat: Number(this.viewdata.item.geo.coords.lat),
      lon: Number(this.viewdata.item.geo.coords.lng),
    };
  }

  public address() {
    return extractAddress({
      viewdata: this.viewdata,
      region: this.region,
      city: this.city,
    });
  }

  public areas() {
    return extractAreas(this.viewdata);
  }

  public deposit() {
    return extractDeposit(this.viewdata);
  }

  public description() {
    return extractDescription(this.viewdata);
  }

  public objectType() {
    return extractObjectType(this.viewdata);
  }

  public photos() {
    return extractPhotos(this.viewdata).photos;
  }

  public seller() {
    return extractSeller(this.viewdata);
  }

  public storey() {
    return extractStorey(this.viewdata);
  }
}
