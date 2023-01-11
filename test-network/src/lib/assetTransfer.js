/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const assets = [
              {
            ID: 'LA0001',
            OwnerName: 'Tariq',
            RegistryNumber: '89749943',
            Area:'khanna',
            City:'rawalpindi',
            District:'rawalpindi',
            Province:'punjab',
            ZipCode: '46000',
            AreaOfLand: 45,
            CostOfLand: 45000000,
            PreviousOwner: 'ali'
            NextOfKin: 'zain',
          },
         {
            ID: 'LA0002',
            OwnerName: 'Irfan',
            RegistryNumber: '89749946',
            Area:'saddar',
            City:'rawalpindi',
            District:'rawalpindi',
            Province:'punjab',
            ZipCode: '46000',
            AreaOfLand: 25,
            CostOfLand: 85000000,
            PreviousOwner: 'hamid'
            NextOfKin: 'zain',
          },
         {
            ID: 'LA0003',
            OwnerName: 'Usman',
            RegistryNumber: '89749956',
            Area:'saddar',
            City:'rawalpindi',
            District:'rawalpindi',
            Province:'punjab',
            ZipCode: '46000',
            AreaOfLand: 15,
            CostOfLand: 65000000,
            PreviousOwner: 'hamid'
            NextOfKin: 'zain',
          },
          {
            ID: 'LA0004',
            OwnerName: 'Sultan',
            RegistryNumber: '89749947',
            Area:'kotli',
            City:'sialkot',
            District:'sialkot',
            Province:'punjab',
            ZipCode: '46000',
            AreaOfLand: 25,
            CostOfLand: 85000000,
            PreviousOwner: 'kamran'
            NextOfKin: 'ali',
          },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, OwnerName, registryNumber, area, city, district, province, zipCode, areaOfLand, costOfLand, previousOwner, nextOfKin) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            ID: id,
            OwnerName: ownerName,
            RegistryNumber: registryNumber,
            Area:area,
            City:city,
            District:district,
            Province:province,
            ZipCode: zipCode,
            AreaOfLand: areaOfLand,
            CostOfLand: costOfLand,
            PreviousOwner: previousOwner,
            NextOfKin: nextOfKin,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, OwnerName, registryNumber, area, city, district, province, zipCode, areaOfLand, costOfLand, previousOwner, nextOfKin) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            OwnerName: ownerName,
            RegistryNumber: registryNumber,
            Area:area,
            City:city,
            District:district,
            Province:province,
            ZipCode: zipCode,
            AreaOfLand: areaOfLand,
            CostOfLand: costOfLand,
            PreviousOwner: previousOwner,
            NextOfKin: nextOfKin,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        asset.PreviousOwner = oldOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = AssetTransfer;
