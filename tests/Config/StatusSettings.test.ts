import { verifyAsJson } from 'approvals/lib/Providers/Jest/JestApprovals';
import { StatusSettings } from '../../src/Config/StatusSettings';
import { Status } from '../../src/Status';
import { StatusConfiguration } from '../../src/StatusConfiguration';
import { StatusRegistry } from '../../src/StatusRegistry';
import type { StatusCollection } from '../../src/StatusCollection';

describe('StatusSettings', () => {
    it('verify default status settings', () => {
        const defaultStatusSettings = new StatusSettings();
        // Core statuses
        expect(defaultStatusSettings.coreStatusTypes.length).toEqual(2);
        expect(defaultStatusSettings.coreStatusTypes[0].symbol).toEqual(' ');
        expect(defaultStatusSettings.coreStatusTypes[1].symbol).toEqual('x');

        // Custom statuses
        expect(defaultStatusSettings.customStatusTypes.length).toEqual(2);
        expect(defaultStatusSettings.customStatusTypes[0].symbol).toEqual('/');
        expect(defaultStatusSettings.customStatusTypes[1].symbol).toEqual('-');

        // This captures the default contents of both core and custom statuses
        verifyAsJson(defaultStatusSettings);
    });

    function setThreeCustomStatuses(settings: StatusSettings) {
        StatusSettings.deleteAllCustomStatuses(settings);
        const pro = new StatusConfiguration('P', 'Pro', 'C', false);
        const imp = new StatusConfiguration('!', 'Important', 'x', false);
        const con = new StatusConfiguration('C', 'Con', 'P', false);
        StatusSettings.addStatus(settings.customStatusTypes, pro);
        StatusSettings.addStatus(settings.customStatusTypes, imp);
        StatusSettings.addStatus(settings.customStatusTypes, con);
        return { pro, imp, con };
    }

    it('should add a status', () => {
        // Arrange
        const settings = new StatusSettings();
        expect(settings.coreStatusTypes.length).toEqual(2);
        expect(settings.customStatusTypes.length).toEqual(2);

        // Act
        const newStatus = new StatusConfiguration('!', 'Important', 'x', false);
        StatusSettings.addStatus(settings.customStatusTypes, newStatus);

        // Assert
        expect(settings.customStatusTypes.length).toEqual(3);
        expect(settings.customStatusTypes[2]).toStrictEqual(newStatus);
    });

    it('should replace a status, if present', () => {
        // Arrange
        const settings = new StatusSettings();
        const { imp } = setThreeCustomStatuses(settings);
        expect(settings.customStatusTypes.length).toEqual(3);
        expect(settings.customStatusTypes[1]).toStrictEqual(imp);

        // Act
        const newImp = new StatusConfiguration('!', 'ReallyImportant', 'X', true);
        StatusSettings.replaceStatus(settings.customStatusTypes, imp, newImp);

        // Assert
        expect(settings.customStatusTypes.length).toEqual(3);
        expect(settings.customStatusTypes[1]).toStrictEqual(newImp);
    });

    it('should bulk-add new statuses, reporting errors', () => {
        // Arrange
        const newStatuses: StatusCollection = [
            ['>', 'Forwarded', 'x', 'TODO'],
            ['<', 'Schedule', 'x', 'TODO'],
            ['?', 'Question', 'x', 'TODO'],
            ['-', 'Dropped - should not be added as duplicate of core Cancelled', 'x', 'CANCELLED'],
            ['>', 'Forwarded', 'x', 'TODO'], // is a duplicate so should not be added
            ['<', 'Duplicate - should not be added as duplicate of Schedule above', 'x', 'TODO'],
            ['', 'Empty - should not be added as no status character', 'x', 'TODO'],
        ];
        const settings = new StatusSettings();

        // Act
        const result = StatusSettings.bulkAddStatusCollection(settings, newStatuses);

        // Assert
        expect(result).toStrictEqual(['The status Forwarded (>) is already added.']);
    });

    it('should delete a status', () => {
        // Arrange
        const settings = new StatusSettings();
        const { pro, imp, con } = setThreeCustomStatuses(settings);
        expect(settings.customStatusTypes.length).toEqual(3);

        // Act
        const result = StatusSettings.deleteStatus(settings.customStatusTypes, imp);

        // Assert
        expect(result).toEqual(true);
        expect(settings.customStatusTypes.length).toEqual(2);
        expect(settings.customStatusTypes[0]).toStrictEqual(pro);
        expect(settings.customStatusTypes[1]).toStrictEqual(con);

        // Delete a second time. It should now report that nothing was deleted.
        const result2 = StatusSettings.deleteStatus(settings.customStatusTypes, imp);
        expect(result2).toEqual(false);
    });

    it('should delete all custom statuses', () => {
        // Arrange
        const settings = new StatusSettings();
        setThreeCustomStatuses(settings);
        expect(settings.customStatusTypes.length).toEqual(3);

        // Act
        StatusSettings.deleteAllCustomStatuses(settings);

        // Assert
        expect(settings.customStatusTypes.length).toEqual(0);
    });

    it('should apply settings to a StatusRegistry', () => {
        // Arrange
        const settings = new StatusSettings();
        const { pro, imp, con } = setThreeCustomStatuses(settings);
        expect(settings.coreStatusTypes.length).toEqual(2);
        expect(settings.customStatusTypes.length).toEqual(3);

        const statusRegistry = new StatusRegistry();
        expect(statusRegistry.registeredStatuses.length).toEqual(4);

        // Act
        StatusSettings.applyToStatusRegistry(settings, statusRegistry);

        // Assert
        const statuses = statusRegistry.registeredStatuses;
        expect(statuses.length).toEqual(5);
        expect(statuses[2]).toStrictEqual(new Status(pro));
        expect(statuses[3]).toStrictEqual(new Status(imp));
        expect(statuses[4]).toStrictEqual(new Status(con));
    });
});
