package org.openmrs.module.ghanaemrfoldernumber.web;

import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemrfoldernumber.FolderNumberService;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping(value = "/ws/ghana/foldernumber")
public class FolderNumberController {

    @RequestMapping(value = "/allocate", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> allocate(@RequestParam(value = "regionCode", required = false) String regionCode,
                                        @RequestParam(value = "facilityCode", required = false) String facilityCode) {
        FolderNumberService svc = Context.getRegisteredComponent("ghanaemrfoldernumber.FolderNumberService", FolderNumberService.class);
        String folder = svc.generateNext(regionCode, facilityCode);
        Map<String, Object> resp = new HashMap<String, Object>();
        resp.put("folderNumber", folder);
        return resp;
    }
}
