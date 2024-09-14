import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';

import { RentObjectCheckerServiceContract } from './contract';
import { TOKEN_CRM_RPC_REST } from './tokens';

@Injectable()
export class RentObjectCheckerService extends RentObjectCheckerServiceContract {
  constructor(
    @Inject(TOKEN_CRM_RPC_REST)
    private crmRpcRest: {
      host: `${string}/rpc`;
      token: string;
    },
  ) {
    super();
  }

  /**
   * Вызво метода `checkAlreadyExistObjects` из файла `app/Modules/RentObject/RentObjectCheckerService.ts` репозитория `api`
   */
  public async checkExistedRentObjectIds(props: {
    source: string;
    rentObjectIds: string[];
  }): Promise<{ notExistedIds: Set<string>; existedIds: Set<string> }> {
    const url = new URL(
      `${this.crmRpcRest.host}/v1/rent-objects/check/${props.source}/${this.crmRpcRest.token}`,
    );

    for (const id of props.rentObjectIds) {
      url.searchParams.append('foreign_id', id);
    }

    const { data } = await axios.get<{
      success: boolean;
      data: { notExistedIds: string[]; existedIds: string[] };
      message: string;
    }>(url.toString());

    if (data.success) {
      return {
        existedIds: new Set(data.data.existedIds),
        notExistedIds: new Set(data.data.notExistedIds),
      };
    }

    throw new Error(`Error check existed rent objects: ${data.message}`);
  }
}
