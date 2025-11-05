package org.openmrs.module.ghanaemr;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.module.BaseModuleActivator;

/**
 * This class contains the logic that is run every time this module is either started or shutdown
 */
public class GhanaEMRActivator extends BaseModuleActivator {

	private Log log = LogFactory.getLog(this.getClass());

	/**
	 * @see BaseModuleActivator#willRefreshContext()
	 */
	public void willRefreshContext() {
		log.info("Refreshing Ghana EMR Module");
	}

	/**
	 * @see BaseModuleActivator#contextRefreshed()
	 */
	public void contextRefreshed() {
		log.info("Ghana EMR Module refreshed");
	}

	/**
	 * @see BaseModuleActivator#willStart()
	 */
	public void willStart() {
		log.info("Starting Ghana EMR Module");
	}

	/**
	 * @see BaseModuleActivator#started()
	 */
	public void started() {
		log.info("Ghana EMR Module started successfully");
		log.info("Ghana EMR Queue Management System initialized");
		log.info("Ghana EMR NHIE Integration Services initialized");
	}

	/**
	 * @see BaseModuleActivator#willStop()
	 */
	public void willStop() {
		log.info("Stopping Ghana EMR Module");
	}

	/**
	 * @see BaseModuleActivator#stopped()
	 */
	public void stopped() {
		log.info("Ghana EMR Module stopped");
	}
}
